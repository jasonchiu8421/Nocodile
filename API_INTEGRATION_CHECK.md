# 前后端 API 对接检查报告

## 检查时间
2024年检查

## 总体状态
⚠️ **部分不匹配** - 发现几个关键问题需要修复

---

## ✅ 正常对接的 API

### 1. `/login` - 用户登录
- **前端**: POST `/login`, body: `{username: string, password: string}`
- **后端**: POST `/login`, expects `LoginRequest {username: str, password: str}`
- **状态**: ✅ 匹配

### 2. `/register` - 用户注册
- **前端**: POST `/register`, body: `{username, password, confirm_password}`
- **后端**: POST `/register`, expects `RegisterRequest {username, password, confirm_password}`
- **状态**: ✅ 匹配

### 3. `/get_project_details` - 获取项目详情
- **前端**: POST `/get_project_details`, body: `{project_id: string}`
- **后端**: POST `/get_project_details`, expects `ProjectRequest {project_id: int}`
- **状态**: ⚠️ 类型不匹配（前端发送 string，后端期望 int，但 FastAPI 会自动转换）

### 4. `/get_classes` - 获取类别
- **前端**: POST `/get_classes`, body: `{project_id: string}`
- **后端**: POST `/get_classes`, expects `ProjectRequest {project_id: int}`
- **状态**: ⚠️ 类型不匹配（但可自动转换）

### 5. `/annotate` - 保存标注
- **前端**: POST `/annotate`, body: `{project_id: int, video_id: string, frame_num: int, bboxes: [...]}`
- **后端**: POST `/annotate`, expects `AnnotationRequest {project_id: int, video_id: int, frame_num: int, bboxes: list}`
- **状态**: ⚠️ `video_id` 类型不匹配（前端 string，后端 int）

### 6. `/upload` - 上传视频
- **前端**: POST `/upload?project_id={id}`, FormData with file
- **后端**: POST `/upload`, expects `project_id: int` (query param), `file: UploadFile`
- **状态**: ✅ 匹配

---

## ❌ 发现的问题

### 问题 1: `/change_project_name` - 参数格式不匹配
**严重程度**: 🔴 高

- **前端发送**:
  ```json
  {
    "project_id": "123",
    "new_name": "New Name"
  }
  ```

- **后端期望**:
  ```python
  # 后端定义：
  @app.post("/change_project_name")
  async def change_project_name(request: ProjectRequest, new_name: str):
  ```
  - `ProjectRequest {project_id: int}` (在 body 中)
  - `new_name: str` (作为查询参数或路径参数)

**问题**: 后端期望 `new_name` 作为单独的参数，但前端将其放在 body 中。

**修复建议**:
```python
# 后端应该改为：
class ChangeProjectNameRequest(BaseModel):
    project_id: int
    new_name: str

@app.post("/change_project_name")
async def change_project_name(request: ChangeProjectNameRequest):
    ...
```

### 问题 2: `/get_projects_info` - 类型不匹配
**严重程度**: 🟡 中

- **前端发送**: `{userID: string}` (转换为字符串)
- **后端期望**: `UserRequest {userID: int}`

**问题**: 前端将 userID 转换为字符串发送，但后端期望整数。

**当前状态**: FastAPI 可能可以自动转换，但不建议依赖此行为。

**修复建议**: 前端应发送整数：
```typescript
body: JSON.stringify({ userID: userId }) // 不要 .toString()
```

### 问题 3: `/add_class` - 参数传递方式混乱
**严重程度**: 🟡 中

- **前端**: 同时使用查询参数和 body
  ```typescript
  url.searchParams.append('project_id', projectId);
  url.searchParams.append('class_name', className);
  url.searchParams.append('colour', color);
  body: JSON.stringify({ project_id: projectId })
  ```

- **后端**: 期望查询参数
  ```python
  async def add_class(request: ProjectRequest, class_name: str, colour: str):
  ```

**问题**: 前端在查询参数和 body 中都发送了 `project_id`，造成混乱。

**修复建议**: 统一使用查询参数或 body，建议使用 body：
```python
class AddClassRequest(BaseModel):
    project_id: int
    class_name: str
    colour: str

@app.post("/add_class")
async def add_class(request: AddClassRequest):
    ...
```

### 问题 4: `/annotate` - video_id 类型不一致
**严重程度**: 🟡 中

- **前端**: `video_id: string`
- **后端**: `video_id: int`

**问题**: 类型不匹配可能导致错误。

**修复建议**: 
- 选项1: 后端接受字符串并转换
- 选项2: 前端确保发送整数

### 问题 5: `/get_projects_info` - 响应字段名不一致
**严重程度**: 🟢 低（已处理）

- **后端返回**: `{"owned projects": [...], "shared projects": [...]}`
- **前端期望**: 相同格式

**状态**: ✅ 前端已正确处理带空格的字段名

---

## 🔧 需要修复的 API

### 高优先级

1. **`/change_project_name`** - 需要修改后端接受 body 中的 `new_name`

### 中优先级

2. **`/get_projects_info`** - 前端应发送整数而非字符串
3. **`/add_class`** - 统一参数传递方式
4. **`/annotate`** - 统一 `video_id` 类型

---

## 📋 检查清单

- [x] 登录 API
- [x] 注册 API
- [x] 项目管理 API
- [x] 上传 API
- [x] 标注 API
- [ ] 训练 API（需要进一步检查）
- [ ] 部署 API（需要进一步检查）

---

## 🎯 建议

1. **统一类型系统**: 前后端应就 ID 类型（int vs string）达成一致
2. **统一参数传递**: 建议所有 POST 请求使用 JSON body，避免混合使用查询参数
3. **添加 API 文档**: 使用 OpenAPI/Swagger 自动生成文档
4. **类型验证**: 在前后端都添加严格的类型验证

---

## 总结

大部分 API 可以正常工作，但有几个关键问题需要修复：
- `/change_project_name` 需要立即修复
- 类型不一致问题需要统一处理
- 参数传递方式需要标准化

建议优先修复 `/change_project_name`，这是最严重的不匹配问题。

