# 英语学习系统项目创建指南

本文档详细记录了英语学习系统项目的完整创建过程，包括环境配置、前后端框架搭建、数据库设计等关键步骤。

## 1. 项目概述

英语学习系统是一个基于Vue.js前端和SpringBoot后端的完整Web应用，旨在为用户提供英语学习、单词记忆、AI阅读理解等功能。项目采用前后端分离架构，实现了用户注册登录、视频学习、单词游戏等核心功能。

## 2. 开发环境准备

### 2.1 必要工具安装

```bash
# 安装Node.js和npm (推荐使用nvm管理Node版本)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
nvm install 16
nvm use 16

# 安装Vue CLI
npm install -g @vue/cli

# 安装Java开发环境 (JDK 11+)
# macOS (使用Homebrew)
brew install openjdk@11

# 安装Maven
brew install maven

# 安装IDE (推荐)
# 前端: VS Code
# 后端: IntelliJ IDEA
```

### 2.2 开发工具配置

**VS Code推荐插件**:
- Vetur (Vue工具)
- ESLint
- Prettier
- TypeScript Vue Plugin
- Auto Import

**IntelliJ IDEA推荐插件**:
- Spring Boot Assistant
- Lombok
- Maven Helper
- JPA Buddy

## 3. 前端项目创建

### 3.1 使用Vite创建Vue项目

```bash
# 创建项目
npm create vite@latest e_learning_vue -- --template vue-ts

# 进入项目目录
cd e_learning_vue

# 安装依赖
npm install
```

### 3.2 安装核心依赖

```bash
# 路由
npm install vue-router@4

# 状态管理
npm install pinia

# UI组件库
npm install element-plus

# HTTP客户端
npm install axios

# 工具库
npm install lodash
npm install dayjs

# 开发依赖
npm install -D sass
npm install -D @types/node
npm install -D unplugin-vue-components unplugin-auto-import
```

### 3.3 项目结构设置

```bash
# 创建项目基本目录结构
mkdir -p src/{api,assets,components,layouts,pages,router,utils,views,interface}
```

### 3.4 配置路由

创建 `src/router/index.ts` 文件:

```typescript
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: () => import('../pages/Login.vue')
  },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    children: [
      // 管理员路由
    ]
  },
  {
    path: '/student',
    component: () => import('../layouts/StudentLayout.vue'),
    children: [
      // 学生路由
    ]
  },
  {
    path: '/teacher',
    component: () => import('../layouts/TeacherLayout.vue'),
    children: [
      // 教师路由
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫
router.beforeEach((to, from, next) => {
  // 身份验证逻辑
  next();
});

export default router;
```

### 3.5 配置API请求

创建 `src/utils/axios/index.ts` 文件:

```typescript
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const instance = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
instance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    // 错误处理
    return Promise.reject(error);
  }
);

export default instance;
```

## 4. 后端项目创建

### 4.1 使用Spring Initializr创建SpringBoot项目

可以通过 [Spring Initializr](https://start.spring.io/) 网站创建，或使用命令行:

```bash
# 使用Spring Boot CLI (需先安装)
spring init --dependencies=web,data-jpa,mysql,lombok,security e_learning_api
```

### 4.2 配置数据库连接

编辑 `src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/e_learning?useSSL=false&serverTimezone=UTC
    username: root
    password: password
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.MySQL8Dialect
  
server:
  port: 8080
  servlet:
    context-path: /api

# 文件上传配置
file:
  upload-dir: ./uploads
```

### 4.3 创建实体类

示例 `User` 实体类:

```java
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String username;
    
    @Column(nullable = false)
    private String password;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<VideoAlbum> albums;
    
    // 其他关联关系
}
```

### 4.4 创建存储库

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}
```

### 4.5 创建服务层

```java
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    public User registerUser(UserRegistrationDto registrationDto) {
        // 检查用户名和邮箱是否已存在
        if (userRepository.existsByUsername(registrationDto.getUsername())) {
            throw new UsernameAlreadyExistsException("Username already exists");
        }
        
        if (userRepository.existsByEmail(registrationDto.getEmail())) {
            throw new EmailAlreadyExistsException("Email already exists");
        }
        
        // 创建新用户
        User user = User.builder()
                .username(registrationDto.getUsername())
                .password(passwordEncoder.encode(registrationDto.getPassword()))
                .email(registrationDto.getEmail())
                .role(Role.STUDENT) // 默认角色
                .build();
        
        return userRepository.save(user);
    }
    
    // 其他服务方法
}
```

### 4.6 创建控制器

```java
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    
    @PostMapping("/register")
    public ResponseEntity<UserResponseDto> registerUser(@Valid @RequestBody UserRegistrationDto registrationDto) {
        User user = userService.registerUser(registrationDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(UserMapper.toResponseDto(user));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDto> getUserById(@PathVariable Long id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(UserMapper.toResponseDto(user));
    }
    
    // 其他API端点
}
```

## 5. 数据库设计与实现

### 5.1 创建数据库

```sql
CREATE DATABASE e_learning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5.2 主要表结构

**用户表 (users)**
```sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role ENUM('ADMIN', 'TEACHER', 'STUDENT') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**视频合集表 (video_albums)**
```sql
CREATE TABLE video_albums (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    cover_image VARCHAR(255),
    teacher_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);
```

**视频表 (videos)**
```sql
CREATE TABLE videos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    video_url VARCHAR(255) NOT NULL,
    thumbnail VARCHAR(255),
    duration INT,
    album_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (album_id) REFERENCES video_albums(id)
);
```

**英语学习表 (english_learning)**
```sql
CREATE TABLE english_learning (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    english_word VARCHAR(100) NOT NULL,
    chinese_translation VARCHAR(255) NOT NULL,
    example_sentence TEXT,
    pronunciation VARCHAR(100),
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**复习状态表 (review_states)**
```sql
CREATE TABLE review_states (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    english_id BIGINT NOT NULL,
    review_count INT DEFAULT 0,
    familiarity INT DEFAULT 0,
    next_review_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (english_id) REFERENCES english_learning(id)
);
```

**复习记录表 (review_logs)**
```sql
CREATE TABLE review_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    english_id BIGINT NOT NULL,
    review_result BOOLEAN,
    review_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (english_id) REFERENCES english_learning(id)
);
```

**AI阅读理解表 (ai_readings)**
```sql
CREATE TABLE ai_readings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    ai_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 6. 前后端集成

### 6.1 配置跨域

**后端配置 (SpringBoot)**:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:5173") // 前端开发服务器地址
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

**前端配置 (Vite)**:

在 `vite.config.ts` 中添加:

```typescript
export default defineConfig({
  // ...其他配置
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});
```

### 6.2 实现用户认证

**后端JWT配置**:

```java
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;
    
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .authorizeRequests()
            .antMatchers("/api/auth/**").permitAll()
            .anyRequest().authenticated()
            .and()
            .sessionManagement()
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .authenticationProvider(authenticationProvider)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
    }
}
```

**前端认证服务**:

```typescript
// src/api/auth.ts
import axios from '../utils/axios';

export const login = (username: string, password: string) => {
  return axios.post('/auth/login', { username, password });
};

export const register = (userData: any) => {
  return axios.post('/auth/register', userData);
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};
```

## 7. 核心功能实现

### 7.1 用户注册与登录

**前端登录组件**:

```vue
<template>
  <div class="login-container">
    <el-form :model="loginForm" :rules="rules" ref="loginFormRef">
      <el-form-item prop="username">
        <el-input v-model="loginForm.username" placeholder="用户名" />
      </el-form-item>
      <el-form-item prop="password">
        <el-input v-model="loginForm.password" type="password" placeholder="密码" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleLogin" :loading="loading">登录</el-button>
        <el-button @click="goToRegister">注册</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { login } from '../api/auth';

const router = useRouter();
const loginFormRef = ref();
const loading = ref(false);

const loginForm = reactive({
  username: '',
  password: ''
});

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;
  
  await loginFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true;
      try {
        const res = await login(loginForm.username, loginForm.password);
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        
        // 根据用户角色跳转到不同页面
        const role = res.user.role.toLowerCase();
        router.push(`/${role}`);
        ElMessage.success('登录成功');
      } catch (error) {
        ElMessage.error('登录失败，请检查用户名和密码');
      } finally {
        loading.value = false;
      }
    }
  });
};

const goToRegister = () => {
  router.push('/register');
};
</script>
```

### 7.2 英语学习功能

**单词学习组件**:

```vue
<template>
  <div class="word-learning">
    <div class="word-card" v-if="currentWord">
      <h2>{{ showTranslation ? currentWord.chineseTranslation : currentWord.englishWord }}</h2>
      <el-button @click="toggleTranslation">{{ showTranslation ? '显示英文' : '显示中文' }}</el-button>
      <div class="navigation">
        <el-button @click="prevWord" :disabled="currentIndex <= 0">上一个</el-button>
        <el-button @click="nextWord" :disabled="currentIndex >= words.length - 1">下一个</el-button>
      </div>
      <div class="review-buttons" v-if="showTranslation">
        <el-button type="danger" @click="markReview(false)">不熟悉</el-button>
        <el-button type="success" @click="markReview(true)">已掌握</el-button>
      </div>
    </div>
    <div v-else class="empty-state">
      <p>暂无单词数据</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getWordList } from '../api/english';
import { createReviewLog } from '../api/reviewLog';

const words = ref([]);
const currentIndex = ref(0);
const currentWord = ref(null);
const showTranslation = ref(false);

onMounted(async () => {
  try {
    const response = await getWordList();
    words.value = response.data;
    if (words.value.length > 0) {
      currentWord.value = words.value[0];
    }
  } catch (error) {
    console.error('Failed to fetch words:', error);
  }
});

const toggleTranslation = () => {
  showTranslation.value = !showTranslation.value;
};

const nextWord = () => {
  if (currentIndex.value < words.value.length - 1) {
    currentIndex.value++;
    currentWord.value = words.value[currentIndex.value];
    showTranslation.value = false;
  }
};

const prevWord = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    currentWord.value = words.value[currentIndex.value];
    showTranslation.value = false;
  }
};

const markReview = async (isKnown: boolean) => {
  if (!currentWord.value) return;
  
  try {
    await createReviewLog({
      englishId: currentWord.value.id,
      reviewResult: isKnown
    });
    nextWord();
  } catch (error) {
    console.error('Failed to save review:', error);
  }
};
</script>
```

### 7.3 AI阅读理解功能

```vue
<template>
  <div class="ai-reading">
    <h2>AI阅读理解</h2>
    <el-form>
      <el-form-item label="输入英文文本">
        <el-input
          type="textarea"
          v-model="readingText"
          :rows="6"
          placeholder="请输入英文文本..."
        ></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitReading" :loading="loading">提交分析</el-button>
      </el-form-item>
    </el-form>
    
    <div v-if="aiResponse" class="ai-response">
      <h3>AI分析结果</h3>
      <div v-html="formattedResponse"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { submitAIReading } from '../api/deepSeekApi';

const readingText = ref('');
const aiResponse = ref('');
const loading = ref(false);

const formattedResponse = computed(() => {
  if (!aiResponse.value) return '';
  // 格式化AI响应，添加HTML标记等
  return aiResponse.value.replace(/\n/g, '<br>');
});

const submitReading = async () => {
  if (!readingText.value.trim()) {
    ElMessage.warning('请输入英文文本');
    return;
  }
  
  loading.value = true;
  try {
    const response = await submitAIReading(readingText.value);
    aiResponse.value = response.data.aiResponse;
  } catch (error) {
    ElMessage.error('AI分析请求失败');
    console.error('AI reading error:', error);
  } finally {
    loading.value = false;
  }
};
</script>
```

## 8. 项目部署

### 8.1 前端构建与部署

```bash
# 构建生产版本
npm run build

# 将dist目录部署到Web服务器
# 例如使用Nginx
```

### 8.2 后端打包与部署

```bash
# 使用Maven打包
mvn clean package -DskipTests

# 运行JAR文件
java -jar -Dspring.profiles.active=prod target/e-learning-api.jar
```

### 8.3 数据库部署

```bash
# 创建生产环境数据库
mysql -u root -p
CREATE DATABASE e_learning_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'e_learning_user'@'%' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON e_learning_prod.* TO 'e_learning_user'@'%';
FLUSH PRIVILEGES;
```

## 9. 项目维护与更新

### 9.1 版本控制

项目使用Git进行版本控制，主要分支:
- `main`: 生产环境代码
- `develop`: 开发环境代码
- `feature/*`: 新功能开发分支
- `bugfix/*`: 错误修复分支

### 9.2 CI/CD流程

使用GitHub Actions自动化部署:

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    # 构建前端
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
    
    - name: Build Frontend
      run: |
        npm install
        npm run build
    
    # 构建后端
    - name: Setup Java
      uses: actions/setup-java@v2
      with:
        java-version: '11'
        distribution: 'adopt'
    
    - name: Build Backend
      run: mvn clean package -DskipTests
    
    # 部署到服务器
    - name: Deploy
      uses: appleboy/scp-action@master
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        source: "dist/,target/*.jar"
        target: "/tmp/deploy"
```

## 10. 总结

本文档详细记录了英语学习系统从零开始的完整创建过程，包括环境配置、前后端框架搭建、数据库设计、核心功能实现和部署流程。通过遵循这些步骤，可以成功构建一个功能完善的英语学习平台。

项目采用了现代化的技术栈和最佳实践:
- 前端: Vue 3 + TypeScript + Vite
- 后端: Spring Boot + Spring Security + JPA
- 数据库: MySQL
- 部署: Nginx + Docker + CI/CD

通过模块化设计和前后端分离架构，系统具有良好的可扩展性和可维护性，可以根据需求不断添加新功能和优化现有功能。