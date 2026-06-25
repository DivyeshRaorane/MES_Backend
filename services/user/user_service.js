import bcrypt from 'bcrypt'
import pool from '../../db/postgres.js'
import jwt from 'jsonwebtoken';

export const createUser = async ({emp_id,emp_name,emp_mail_id,password,mobile_no,role,departments})=>{

    const client = await pool.connect();

    try{
        await client.query("BEGIN");

        const existing = await client.query(
            `SELECT emp_id FROM users WHERE emp_id= $1`,
            [emp_id]
        );

        if(existing.rows.length > 0){
            throw new Error("User already exists");
        }

        const hashedPassword = await bcrypt.hash(password,10);

        const userResult = await client.query(
            `INSERT INTO users (emp_id,emp_name,emp_mail_id,password,mobile_no,role)
            VALUES ($1,$2,$3,$4,$5,$6)
            RETURNING emp_id, emp_name,emp_mail_id,mobile_no,role`,
            [emp_id,emp_name,emp_mail_id,hashedPassword,mobile_no,role]
        );

        const user = userResult.rows[0];

         if (departments && departments.length > 0) {
      for (let deptId of departments) {
        await client.query(
          `INSERT INTO user_departments (emp_id, department_id)
           VALUES ($1, $2)`,
          [user.emp_id, deptId]
        );
      }
     }

     await client.query("COMMIT");
     return user
    }catch(error){
        await client.query("ROLLBACK");
        throw error;
    }finally{
        client.release();
    }
};


export const loginService = async({emp_id,password})=>{
   
    const result = await pool.query(
        `SELECT emp_id,emp_name,role,password
        FROM users 
        WHERE emp_id = $1`,
        [emp_id]
    );
 
    const user = result.rows[0];

    if(!user){
        throw new Error('Invalid Emp ID or password')
    };

    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    );

    if(!isPasswordValid){
        throw new Error('Password is Invalid')
    };

    const token = jwt.sign(
        {emp_id:user.emp_id,
            role:user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn:'1d',
        }
    )

    delete user.password;

    return{
        user,
        token
    }
}

export const getUsersS = async (filters = {}) => {
  const { emp_id, role, department_id } = filters;

  let query = `
    SELECT 
      u.emp_id,
      u.emp_name,
      u.emp_mail_id,
      u.mobile_no,
      u.role,
      u.is_active,
      json_agg(
        json_build_object(
          'id', d.id,
          'name', d.d_name
        )
      ) FILTER (WHERE d.id IS NOT NULL) AS departments
    FROM users u
    LEFT JOIN user_departments ud ON u.emp_id = ud.emp_id
    LEFT JOIN departments d ON ud.department_id = d.id
  `;

  const values = [];
  const conditions = [];

  // filter: emp_id
  if (emp_id) {
    values.push(emp_id);
    conditions.push(`u.emp_id = $${values.length}`);
  }

  // filter: role
  if (role) {
    values.push(role);
    conditions.push(`u.role = $${values.length}`);
  }

  // filter: department
  if (department_id) {
    values.push(department_id);
    conditions.push(`ud.department_id = $${values.length}`);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += `
    GROUP BY u.emp_id, u.emp_name, u.emp_mail_id, u.mobile_no, u.role
    ORDER BY u.emp_id
  `;

  const result = await pool.query(query, values);

  return result.rows;
};
