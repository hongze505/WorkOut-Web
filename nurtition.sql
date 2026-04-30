USE Katachidb;
GO

-- 如果之前已經建過 user_tdee_profile 表,先刪掉(因為要合併進 users)
DROP TABLE IF EXISTS user_tdee_profile;

-- 建立完整的 users 表
CREATE TABLE users (
    -- ===== 帳號資料 =====
    user_id         INT IDENTITY(1,1) PRIMARY KEY,    -- 自動編號
    email           NVARCHAR(100) UNIQUE NOT NULL,    -- 信箱(不能重複)
    password_hash   NVARCHAR(255) NOT NULL,           -- 密碼(加密後)
    username        NVARCHAR(50),                     -- 顯示名稱
    created_at      DATETIME DEFAULT GETDATE(),       -- 註冊時間
    
    -- ===== 身體資料(可以為 NULL,等使用者填) =====
    gender              NVARCHAR(10),                 -- 'male' / 'female'
    age                 INT,
    height              DECIMAL(5,1),                 -- 175.5 cm
    weight              DECIMAL(5,1),                 -- 70.5 kg
    activity            DECIMAL(4,3),                 -- 1.2 / 1.375 / 1.55 ...
    profile_updated_at  DATETIME                      -- 身體資料最後更新時間
);
