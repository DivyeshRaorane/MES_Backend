-- Master table for Teams (dropdown: Die Team, Ground Team, Furnace Team)

CREATE TABLE master_team (
    team_id SERIAL PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    team_type VARCHAR(30) NOT NULL CHECK (team_type IN ('die', 'ground', 'furnace')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
