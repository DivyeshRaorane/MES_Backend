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
        throw new Error('Invalid email or password')
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
