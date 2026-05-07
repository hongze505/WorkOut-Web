# KATACHI 訓練計畫產生器 — ASP.NET Core MVC 統整

## 一、整體架構

```
前端 (View)
    ↓ fetch POST /Plan/Generate
Controller (PlanController.cs)
    ↓ 呼叫
Service (PlanService.cs)
    ↓ LINQ 查詢
DbContext (KatachiDbContext.cs)
    ↓
資料庫 (SQL Server - Katachidb)
    ↓ 回傳 JSON
前端 renderResult() 顯示課表
```

---

## 二、資料庫（SQL Server）

### 三張表

| 表名 | 用途 |
|------|------|
| `exercises` | 動作主表（槓鈴臥推、深蹲...） |
| `exercise_goals` | 每個動作對應不同目標的組數次數 |
| `day_templates` | 幾天訓練該練哪些肌群 |

### 建表 SQL

```sql
USE Katachidb;

-- Table 1: exercises
CREATE TABLE exercises (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    name          NVARCHAR(100) NOT NULL,
    muscle_group  NVARCHAR(20)  NOT NULL,
    movement_type NVARCHAR(20)  NOT NULL,
    equipment     NVARCHAR(20)  NOT NULL,
    is_compound   BIT DEFAULT 0
);
CREATE INDEX idx_filter ON exercises (muscle_group, equipment);

-- Table 2: exercise_goals
CREATE TABLE exercise_goals (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    exercise_id  INT          NOT NULL,
    goal         NVARCHAR(20) NOT NULL,
    sets         INT          NOT NULL,
    reps_min     INT          NOT NULL,
    reps_max     INT          NOT NULL,
    rest_seconds NVARCHAR(20) NOT NULL,
    CONSTRAINT FK_exercise_goals_exercise
        FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
    CONSTRAINT UQ_exercise_goal UNIQUE (exercise_id, goal)
);

-- Table 3: day_templates
CREATE TABLE day_templates (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    total_days     INT           NOT NULL,
    day_number     INT           NOT NULL,
    day_name       NVARCHAR(50)  NOT NULL,
    target_groups  NVARCHAR(255) NOT NULL,
    exercise_count INT           NOT NULL DEFAULT 6,
    CONSTRAINT UQ_day_template UNIQUE (total_days, day_number)
);
```

### 查詢邏輯

```
使用者選: 4天 + 增肌 + 槓鈴+啞鈴
    ↓
Step 1: SELECT * FROM day_templates WHERE total_days = 4
    → 回傳 4 筆（上肢推/下肢/上肢拉/下肢+核心）

Step 2: 分解 target_groups
    "胸,肩,手臂" → ["胸","肩","手臂"]

Step 3: JOIN exercises + exercise_goals
    WHERE muscle_group IN (胸,肩,手臂)
      AND equipment IN (槓鈴,啞鈴)
      AND goal = 'hypertrophy'
    ORDER BY is_compound DESC, NEWID()
    TOP (exercise_count)
```

---

## 三、專案資料夾結構

```
katachi/
├── Controllers/
│   └── PlanController.cs       ← 接收請求、回傳 JSON
│
├── Models/
│   ├── Entities/               ← 對應資料庫的表
│   │   ├── Exercise.cs
│   │   ├── ExerciseGoal.cs
│   │   └── DayTemplate.cs
│   ├── Plan/                   ← 資料傳輸格式
│   │   ├── GenerateRequest.cs  ← 接收前端選擇
│   │   ├── DayPlan.cs          ← 回傳給前端的課表
│   │   └── PlanService.cs      ← 查資料庫的邏輯
│   └── KatachiDbContext.cs     ← 連接資料庫的橋樑
│
├── Views/
│   └── Plan/
│       └── Index.cshtml        ← programs.html 改的
│
├── wwwroot/
│   ├── css/
│   │   ├── tokens.css
│   │   └── programs.css
│   └── js/
│       └── programs.js
│
├── appsettings.json            ← 連線字串
└── Program.cs                  ← 啟動設定
```

---

## 四、各檔案內容

### `appsettings.json`

```json
{
  "ConnectionStrings": {
    "KatachiDB": "Server=localhost;Database=Katachidb;Integrated Security=True;TrustServerCertificate=True"
  }
}
```

---

### `Program.cs`

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();
builder.Services.AddDbContext<KatachiDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("KatachiDB")
    )
);

var app = builder.Build();

app.UseStaticFiles();
app.UseRouting();
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
```

---

### `Models/Entities/Exercise.cs`

```csharp
using System.ComponentModel.DataAnnotations.Schema;

namespace WebApplication1.Models.Entities
{
    [Table("exercises")]
    public class Exercise
    {
        public int Id { get; set; }
        public string Name { get; set; }

        [Column("muscle_group")]
        public string MuscleGroup { get; set; }

        [Column("movement_type")]
        public string MovementType { get; set; }

        public string Equipment { get; set; }

        [Column("is_compound")]
        public bool IsCompound { get; set; }

        public List<ExerciseGoal> Goals { get; set; }
    }
}
```

---

### `Models/Entities/ExerciseGoal.cs`

```csharp
using System.ComponentModel.DataAnnotations.Schema;

namespace WebApplication1.Models.Entities
{
    [Table("exercise_goals")]
    public class ExerciseGoal
    {
        public int Id { get; set; }

        [Column("exercise_id")]
        public int ExerciseId { get; set; }

        public string Goal { get; set; }
        public int Sets { get; set; }

        [Column("reps_min")]
        public int RepsMin { get; set; }

        [Column("reps_max")]
        public int RepsMax { get; set; }

        [Column("rest_seconds")]
        public string RestSeconds { get; set; }

        public Exercise Exercise { get; set; }
    }
}
```

---

### `Models/Entities/DayTemplate.cs`

```csharp
using System.ComponentModel.DataAnnotations.Schema;

namespace WebApplication1.Models.Entities
{
    [Table("day_templates")]
    public class DayTemplate
    {
        public int Id { get; set; }

        [Column("total_days")]
        public int TotalDays { get; set; }

        [Column("day_number")]
        public int DayNumber { get; set; }

        [Column("day_name")]
        public string DayName { get; set; }

        [Column("target_groups")]
        public string TargetGroups { get; set; }

        [Column("exercise_count")]
        public int ExerciseCount { get; set; }
    }
}
```

---

### `Models/KatachiDbContext.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using WebApplication1.Models.Entities;

namespace WebApplication1.Models
{
    public class KatachiDbContext : DbContext
    {
        public KatachiDbContext(DbContextOptions<KatachiDbContext> options)
            : base(options) { }

        public DbSet<Exercise> Exercises { get; set; }
        public DbSet<ExerciseGoal> ExerciseGoals { get; set; }
        public DbSet<DayTemplate> DayTemplates { get; set; }
    }
}
```

---

### `Models/Plan/GenerateRequest.cs`

```csharp
namespace WebApplication1.Models.Plan
{
    public class GenerateRequest
    {
        public string Goal { get; set; }           // "hypertrophy" / "strength" / "fatloss"
        public int Days { get; set; }              // 2~6
        public List<string> Equipment { get; set; } // ["槓鈴", "啞鈴"]
    }
}
```

---

### `Models/Plan/DayPlan.cs`

```csharp
namespace WebApplication1.Models.Plan
{
    public class DayPlan
    {
        public int DayNumber { get; set; }
        public string DayName { get; set; }
        public List<ExerciseItem> Exercises { get; set; }
    }

    public class ExerciseItem
    {
        public string Name { get; set; }
        public string MuscleGroup { get; set; }
        public string Equipment { get; set; }
        public int Sets { get; set; }
        public int RepsMin { get; set; }
        public int RepsMax { get; set; }
        public string RestSeconds { get; set; }
    }

    public class PlanResult
    {
        public List<DayPlan> WeekDays { get; set; }
        public Prescription Prescription { get; set; }
    }

    public class Prescription
    {
        public int Sets { get; set; }
        public string Reps { get; set; }
        public string Rest { get; set; }
    }
}
```

---

### `Models/Plan/PlanService.cs`

```csharp
using Microsoft.EntityFrameworkCore;
using WebApplication1.Models.Entities;

namespace WebApplication1.Models.Plan
{
    public class PlanService
    {
        private readonly KatachiDbContext _db;

        public PlanService(KatachiDbContext db)
        {
            _db = db;
        }

        public PlanResult Generate(GenerateRequest req)
        {
            var result = new PlanResult
            {
                WeekDays = new List<DayPlan>(),
                Prescription = GetPrescription(req.Goal)
            };

            // Step 1: 查 day_templates
            var templates = _db.DayTemplates
                .Where(t => t.TotalDays == req.Days)
                .OrderBy(t => t.DayNumber)
                .ToList();

            // Step 2: 迴圈每一天
            foreach (var template in templates)
            {
                // 分解 "胸,肩,手臂" → ["胸","肩","手臂"]
                var muscleGroups = template.TargetGroups.Split(',');

                // Step 3: JOIN exercises + exercise_goals
                var exercises = _db.ExerciseGoals
                    .Include(eg => eg.Exercise)
                    .Where(eg =>
                        muscleGroups.Contains(eg.Exercise.MuscleGroup) &&
                        req.Equipment.Contains(eg.Exercise.Equipment) &&
                        eg.Goal == req.Goal
                    )
                    .OrderByDescending(eg => eg.Exercise.IsCompound)
                    .Take(template.ExerciseCount)
                    .Select(eg => new ExerciseItem
                    {
                        Name        = eg.Exercise.Name,
                        MuscleGroup = eg.Exercise.MuscleGroup,
                        Equipment   = eg.Exercise.Equipment,
                        Sets        = eg.Sets,
                        RepsMin     = eg.RepsMin,
                        RepsMax     = eg.RepsMax,
                        RestSeconds = eg.RestSeconds
                    })
                    .ToList();

                result.WeekDays.Add(new DayPlan
                {
                    DayNumber = template.DayNumber,
                    DayName   = template.DayName,
                    Exercises = exercises
                });
            }

            return result;
        }

        private Prescription GetPrescription(string goal)
        {
            return goal switch
            {
                "hypertrophy" => new Prescription { Sets = 4, Reps = "8–12",  Rest = "60–90 秒" },
                "strength"    => new Prescription { Sets = 5, Reps = "3–5",   Rest = "3–5 分鐘" },
                "fatloss"     => new Prescription { Sets = 3, Reps = "15–20", Rest = "30–45 秒" },
                _             => new Prescription { Sets = 4, Reps = "8–12",  Rest = "60–90 秒" }
            };
        }
    }
}
```

---

### `Controllers/PlanController.cs`

```csharp
using Microsoft.AspNetCore.Mvc;
using WebApplication1.Models;
using WebApplication1.Models.Plan;

namespace WebApplication1.Controllers
{
    public class PlanController : Controller
    {
        private readonly KatachiDbContext _db;

        public PlanController(KatachiDbContext db)
        {
            _db = db;
        }

        // GET: /Plan/Index
        [HttpGet]
        public IActionResult Index()
        {
            return View();
        }

        // POST: /Plan/Generate
        [HttpPost]
        public IActionResult Generate([FromBody] GenerateRequest req)
        {
            if (req == null || req.Equipment == null || req.Equipment.Count == 0)
                return BadRequest("參數不完整");

            var service = new PlanService(_db);
            var result = service.Generate(req);

            return Json(new {
                weekDays     = result.WeekDays,
                prescription = result.Prescription
            });
        }
    }
}
```

---

### `wwwroot/js/programs.js` — 改 `generatePlan`

```javascript
async function generatePlan() {
  if (form.equipment.length === 0) {
    showToast("請至少選擇一種器材");
    return;
  }

  try {
    const res = await fetch('/Plan/Generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal: form.goal,
        days: form.days,
        equipment: form.equipment
      })
    });

    if (!res.ok) {
      showToast("產生失敗，請稍後再試");
      return;
    }

    const data = await res.json();
    renderResult(data.weekDays, data.prescription);

  } catch (err) {
    console.error(err);
    showToast("網路錯誤");
  }
}
```

---

### `Views/Plan/Index.cshtml`

```cshtml
@{
    Layout = null;
}
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
  <title>訓練計畫 — KATACHI</title>
  <link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="~/css/tokens.css" />
  <link rel="stylesheet" href="~/css/programs.css" />
</head>
<body>
  <!-- programs.html 的 body 內容全部貼這裡 -->
  <script src="~/js/programs.js"></script>
</body>
</html>
```

---

## 五、MVC 三層職責

| 層 | 檔案 | 負責什麼 |
|----|------|---------|
| **Model** | `Entities/*.cs` | 對應資料庫的表結構 |
| **Model** | `Plan/DayPlan.cs` | 定義回傳給前端的格式 |
| **Model** | `Plan/PlanService.cs` | 查資料庫、組合課表邏輯 |
| **Model** | `KatachiDbContext.cs` | 連接資料庫的橋樑 |
| **View** | `Views/Plan/Index.cshtml` | 使用者看到的頁面 |
| **Controller** | `PlanController.cs` | 接收請求、叫 Service 查資料、回傳結果 |

---

## 六、前後端資料流

```
前端送出:
{
  "goal": "hypertrophy",
  "days": 4,
  "equipment": ["槓鈴", "啞鈴"]
}

後端回傳:
{
  "weekDays": [
    {
      "dayNumber": 1,
      "dayName": "上肢推",
      "exercises": [
        {
          "name": "槓鈴臥推",
          "muscleGroup": "胸",
          "equipment": "槓鈴",
          "sets": 4,
          "repsMin": 8,
          "repsMax": 12,
          "restSeconds": "60-90"
        }
      ]
    }
  ],
  "prescription": {
    "sets": 4,
    "reps": "8–12",
    "rest": "60–90 秒"
  }
}
```

---

## 七、安裝套件（NuGet）

```
Microsoft.EntityFrameworkCore.SqlServer
Microsoft.EntityFrameworkCore.Tools
```

---

## 八、測試步驟

1. SSMS 建好三張表並塞入資料
2. 確認 appsettings.json 連線字串正確
3. F5 啟動專案
4. 瀏覽器開 https://localhost:xxxx/Plan/Index
5. 選好條件按「產生訓練計畫」
6. F12 → Network 確認 POST /Plan/Generate 有送出
7. 確認回傳 JSON 有課表資料
8. 課表顯示在頁面上 ✅