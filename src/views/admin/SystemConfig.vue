<template>
  <div class="system-config">
    <div class="config-header">
      <h2>系统配置</h2>
      <el-button type="primary" @click="saveConfig" :loading="saving">
        <el-icon><DocumentChecked /></el-icon>
        保存配置
      </el-button>
    </div>

    <el-tabs v-model="activeTab" type="border-card" class="config-tabs">
      <!-- 网站设置 -->
      <el-tab-pane label="网站设置" name="website">
        <el-form label-width="140px" class="config-form">
          <el-divider content-position="left">基本信息</el-divider>
          <el-form-item label="网站名称">
            <el-input v-model="config.website.name" placeholder="输入网站名称" />
          </el-form-item>
          <el-form-item label="网站标题">
            <el-input v-model="config.website.title" placeholder="输入网站标题" />
          </el-form-item>
          <el-form-item label="网站描述">
            <el-input v-model="config.website.description" type="textarea" :rows="3" placeholder="输入网站描述" />
          </el-form-item>
          <el-form-item label="网站关键字">
            <el-input v-model="config.website.keywords" placeholder="用逗号分隔" />
          </el-form-item>
          <el-divider content-position="left">联系信息</el-divider>
          <el-form-item label="联系邮箱">
            <el-input v-model="config.website.email" placeholder="联系邮箱" />
          </el-form-item>
          <el-form-item label="联系电话">
            <el-input v-model="config.website.phone" placeholder="联系电话" />
          </el-form-item>
          <el-form-item label="备案号">
            <el-input v-model="config.website.icp" placeholder="如：京ICP备xxxxxx号" />
          </el-form-item>
          <el-form-item label="版权信息">
            <el-input v-model="config.website.copyright" placeholder="版权信息" />
          </el-form-item>
          <el-divider content-position="left">SEO 设置</el-divider>
          <el-form-item label="站点地图">
            <el-switch v-model="config.website.sitemapEnabled" />
          </el-form-item>
          <el-form-item label="Robots.txt">
            <el-input v-model="config.website.robots" type="textarea" :rows="4" placeholder="Robots.txt 内容" />
          </el-form-item>
          <el-form-item label="Canonical URL">
            <el-input v-model="config.website.canonicalUrl" placeholder="https://example.com" />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 上传设置 -->
      <el-tab-pane label="上传设置" name="upload">
        <el-form label-width="140px" class="config-form">
          <el-divider content-position="left">图片上传</el-divider>
          <el-form-item label="最大文件大小">
            <el-input-number v-model="config.upload.imageMaxSize" :min="1" :max="50" />
            <span class="form-unit">MB</span>
          </el-form-item>
          <el-form-item label="允许的图片格式">
            <el-checkbox-group v-model="config.upload.imageTypes">
              <el-checkbox label="jpg" />
              <el-checkbox label="jpeg" />
              <el-checkbox label="png" />
              <el-checkbox label="gif" />
              <el-checkbox label="webp" />
              <el-checkbox label="svg" />
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="图片压缩">
            <el-switch v-model="config.upload.imageCompression" />
            <span class="form-hint">上传时自动压缩图片</span>
          </el-form-item>
          <el-form-item v-if="config.upload.imageCompression" label="压缩质量">
            <el-slider v-model="config.upload.compressionQuality" :min="10" :max="100" style="width: 200px" />
            <span class="form-unit">{{ config.upload.compressionQuality }}%</span>
          </el-form-item>
          <el-divider content-position="left">视频上传</el-divider>
          <el-form-item label="最大文件大小">
            <el-input-number v-model="config.upload.videoMaxSize" :min="1" :max="5000" />
            <span class="form-unit">MB</span>
          </el-form-item>
          <el-form-item label="允许的视频格式">
            <el-checkbox-group v-model="config.upload.videoTypes">
              <el-checkbox label="mp4" />
              <el-checkbox label="avi" />
              <el-checkbox label="mov" />
              <el-checkbox label="wmv" />
              <el-checkbox label="flv" />
              <el-checkbox label="mkv" />
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="视频转码">
            <el-switch v-model="config.upload.videoTranscode" />
            <span class="form-hint">自动转换为 H.264 编码</span>
          </el-form-item>
          <el-divider content-position="left">水印设置</el-divider>
          <el-form-item label="开启水印">
            <el-switch v-model="config.upload.watermarkEnabled" />
          </el-form-item>
          <el-form-item v-if="config.upload.watermarkEnabled" label="水印位置">
            <el-radio-group v-model="config.upload.watermarkPosition">
              <el-radio label="bottom-right">右下角</el-radio>
              <el-radio label="bottom-left">左下角</el-radio>
              <el-radio label="top-right">右上角</el-radio>
              <el-radio label="top-left">左上角</el-radio>
              <el-radio label="center">居中</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="config.upload.watermarkEnabled" label="水印透明度">
            <el-slider v-model="config.upload.watermarkOpacity" :min="10" :max="100" style="width: 200px" />
            <span class="form-unit">{{ config.upload.watermarkOpacity }}%</span>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 用户设置 -->
      <el-tab-pane label="用户设置" name="user">
        <el-form label-width="140px" class="config-form">
          <el-divider content-position="left">注册设置</el-divider>
          <el-form-item label="允许注册">
            <el-switch v-model="config.user.allowRegister" />
          </el-form-item>
          <el-form-item label="注册方式">
            <el-radio-group v-model="config.user.registerType">
              <el-radio label="email">邮箱注册</el-radio>
              <el-radio label="phone">手机注册</el-radio>
              <el-radio label="both">两者均可</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="注册验证码">
            <el-switch v-model="config.user.registerVerify" />
            <span class="form-hint">注册时需要邮箱/手机验证</span>
          </el-form-item>
          <el-form-item label="注册审核">
            <el-switch v-model="config.user.registerReview" />
            <span class="form-hint">新用户需要管理员审核</span>
          </el-form-item>
          <el-divider content-position="left">登录设置</el-divider>
          <el-form-item label="记住登录">
            <el-switch v-model="config.user.rememberLogin" />
          </el-form-item>
          <el-form-item label="记住时间">
            <el-input-number v-model="config.user.rememberDays" :min="1" :max="30" />
            <span class="form-unit">天</span>
          </el-form-item>
          <el-form-item label="登录验证码">
            <el-switch v-model="config.user.loginCaptcha" />
          </el-form-item>
          <el-form-item label="登录失败锁定">
            <el-switch v-model="config.user.loginLock" />
          </el-form-item>
          <el-form-item v-if="config.user.loginLock" label="锁定阈值">
            <el-input-number v-model="config.user.lockThreshold" :min="3" :max="10" />
            <span class="form-hint">次失败后锁定</span>
          </el-form-item>
          <el-form-item v-if="config.user.loginLock" label="锁定时间">
            <el-input-number v-model="config.user.lockMinutes" :min="5" :max="1440" />
            <span class="form-unit">分钟</span>
          </el-form-item>
          <el-divider content-position="left">头像设置</el-divider>
          <el-form-item label="默认头像">
            <el-radio-group v-model="config.user.defaultAvatar">
              <el-radio label="system">系统默认</el-radio>
              <el-radio label="gravatar">Gravatar</el-radio>
              <el-radio label="custom">自定义</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="头像大小限制">
            <el-input-number v-model="config.user.avatarMaxSize" :min="50" :max="5000" />
            <span class="form-unit">KB</span>
          </el-form-item>
          <el-divider content-position="left">资料设置</el-divider>
          <el-form-item label="允许修改用户名">
            <el-switch v-model="config.user.allowChangeUsername" />
          </el-form-item>
          <el-form-item label="必填资料">
            <el-checkbox-group v-model="config.user.requiredFields">
              <el-checkbox label="nickname">昵称</el-checkbox>
              <el-checkbox label="phone">手机</el-checkbox>
              <el-checkbox label="email">邮箱</el-checkbox>
              <el-checkbox label="bio">个人简介</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 安全设置 -->
      <el-tab-pane label="安全设置" name="security">
        <el-form label-width="140px" class="config-form">
          <el-divider content-position="left">密码安全</el-divider>
          <el-form-item label="强制修改密码">
            <el-switch v-model="config.security.forcePasswordChange" />
            <span class="form-hint">首次登录强制修改密码</span>
          </el-form-item>
          <el-form-item label="密码最小长度">
            <el-input-number v-model="config.security.passwordMinLength" :min="6" :max="32" />
          </el-form-item>
          <el-form-item label="密码复杂度">
            <el-switch v-model="config.security.passwordComplexity" />
            <span class="form-hint">包含大小写字母、数字和特殊字符</span>
          </el-form-item>
          <el-form-item label="密码过期天数">
            <el-input-number v-model="config.security.passwordExpireDays" :min="0" :max="365" />
            <span class="form-hint">0 表示永不过期</span>
          </el-form-item>
          <el-form-item label="密码历史记录">
            <el-input-number v-model="config.security.passwordHistory" :min="0" :max="10" />
            <span class="form-hint">不能重复使用最近 N 个密码</span>
          </el-form-item>
          <el-divider content-position="left">会话管理</el-divider>
          <el-form-item label="会话超时时间">
            <el-input-number v-model="config.security.sessionTimeout" :min="30" :max="1440" />
            <span class="form-unit">分钟</span>
          </el-form-item>
          <el-form-item label="多设备登录">
            <el-switch v-model="config.security.allowMultiLogin" />
          </el-form-item>
          <el-form-item v-if="!config.security.allowMultiLogin" label="顶掉其他设备">
            <el-switch v-model="config.security.kickOtherDevice" />
          </el-form-item>
          <el-divider content-position="left">IP 安全</el-divider>
          <el-form-item label="IP黑名单">
            <el-input v-model="config.security.ipBlacklist" type="textarea" :rows="3" placeholder="每行一个IP地址" />
          </el-form-item>
          <el-form-item label="IP白名单">
            <el-input v-model="config.security.ipWhitelist" type="textarea" :rows="3" placeholder="仅白名单IP可访问，空行表示不限制" />
          </el-form-item>
          <el-form-item label="代理检测">
            <el-switch v-model="config.security.proxyDetect" />
            <span class="form-hint">检测并阻止代理/VPN访问</span>
          </el-form-item>
          <el-divider content-position="left">数据保护</el-divider>
          <el-form-item label="数据加密存储">
            <el-switch v-model="config.security.dataEncryption" />
          </el-form-item>
          <el-form-item label="敏感信息脱敏">
            <el-switch v-model="config.security.dataMasking" />
            <span class="form-hint">手机号、身份证等敏感信息部分隐藏</span>
          </el-form-item>
          <el-form-item label="审计日志">
            <el-switch v-model="config.security.auditLog" />
            <span class="form-hint">记录所有用户操作日志</span>
          </el-form-item>
          <el-form-item v-if="config.security.auditLog" label="日志保留天数">
            <el-input-number v-model="config.security.logRetentionDays" :min="30" :max="365" />
            <span class="form-unit">天</span>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 复习设置 -->
      <el-tab-pane label="复习设置" name="review">
        <el-form label-width="160px" class="config-form">
          <el-divider content-position="left">艾宾浩斯遗忘曲线</el-divider>
          <el-form-item label="启用智能复习">
            <el-switch v-model="config.review.enabled" />
          </el-form-item>
          <el-form-item label="复习间隔天数">
            <div class="interval-inputs">
              <el-input-number v-model="config.review.intervals[0]" :min="1" :max="30" size="small" />
              <span>天后</span>
              <span class="arrow">→</span>
              <el-input-number v-model="config.review.intervals[1]" :min="1" :max="60" size="small" />
              <span>天后</span>
              <span class="arrow">→</span>
              <el-input-number v-model="config.review.intervals[2]" :min="1" :max="120" size="small" />
              <span>天后</span>
            </div>
          </el-form-item>
          <el-form-item label="每日新词上限">
            <el-input-number v-model="config.review.dailyNewWords" :min="5" :max="100" />
            <span class="form-unit">个</span>
          </el-form-item>
          <el-form-item label="每日复习上限">
            <el-input-number v-model="config.review.dailyReviewLimit" :min="20" :max="500" />
            <span class="form-unit">个</span>
          </el-form-item>
          <el-divider content-position="left">复习提醒</el-divider>
          <el-form-item label="复习提醒时间">
            <el-time-select
              v-model="config.review.reminderTime"
              start="06:00"
              step="00:30"
              end="22:00"
              placeholder="选择时间"
            />
          </el-form-item>
          <el-form-item label="开启复习提醒">
            <el-switch v-model="config.review.reminderEnabled" />
          </el-form-item>
          <el-form-item v-if="config.review.reminderEnabled" label="提醒方式">
            <el-checkbox-group v-model="config.review.reminderWays">
              <el-checkbox label="browser">浏览器推送</el-checkbox>
              <el-checkbox label="email">邮件</el-checkbox>
              <el-checkbox label="sms">短信</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-divider content-position="left">学习奖励</el-divider>
          <el-form-item label="启用积分系统">
            <el-switch v-model="config.review.pointsEnabled" />
          </el-form-item>
          <el-form-item v-if="config.review.pointsEnabled" label="每正确一次获得">
            <el-input-number v-model="config.review.pointsPerCorrect" :min="1" :max="20" />
            <span class="form-unit">积分</span>
          </el-form-item>
          <el-form-item v-if="config.review.pointsEnabled" label="每错误一次">
            <el-input-number v-model="config.review.pointsPerWrong" :min="0" :max="10" />
            <span class="form-unit">积分</span>
          </el-form-item>
          <el-form-item v-if="config.review.pointsEnabled" label="连续学习奖励">
            <el-input-number v-model="config.review.streakBonus" :min="0" :max="100" />
            <span class="form-unit">积分/天</span>
          </el-form-item>
          <el-form-item v-if="config.review.pointsEnabled" label="连续学习天数">
            <el-input-number v-model="config.review.streakThreshold" :min="3" :max="30" />
            <span class="form-unit">天</span>
          </el-form-item>
          <el-divider content-position="left">学习统计</el-divider>
          <el-form-item label="显示统计图表">
            <el-switch v-model="config.review.showStatistics" />
          </el-form-item>
          <el-form-item label="显示排行榜">
            <el-switch v-model="config.review.showLeaderboard" />
          </el-form-item>
          <el-form-item label="数据导出">
            <el-switch v-model="config.review.dataExport" />
            <span class="form-hint">允许用户导出学习数据</span>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 邮件设置 -->
      <el-tab-pane label="邮件设置" name="email">
        <el-form label-width="140px" class="config-form">
          <el-divider content-position="left">SMTP 配置</el-divider>
          <el-form-item label="SMTP 服务器">
            <el-input v-model="config.email.smtpHost" placeholder="smtp.example.com" />
          </el-form-item>
          <el-form-item label="SMTP 端口">
            <el-input-number v-model="config.email.smtpPort" :min="1" :max="65535" />
          </el-form-item>
          <el-form-item label="加密方式">
            <el-radio-group v-model="config.email.smtpEncryption">
              <el-radio label="none">无</el-radio>
              <el-radio label="ssl">SSL</el-radio>
              <el-radio label="tls">TLS</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="SMTP 用户名">
            <el-input v-model="config.email.smtpUser" placeholder="用户名" />
          </el-form-item>
          <el-form-item label="SMTP 密码">
            <el-input v-model="config.email.smtpPassword" type="password" show-password placeholder="密码" />
          </el-form-item>
          <el-form-item label="发件人昵称">
            <el-input v-model="config.email.fromName" placeholder="系统管理员" />
          </el-form-item>
          <el-form-item label="发件人邮箱">
            <el-input v-model="config.email.fromEmail" placeholder="admin@example.com" />
          </el-form-item>
          <el-form-item label="回复地址">
            <el-input v-model="config.email.replyTo" placeholder="reply@example.com" />
          </el-form-item>
          <el-form-item label="测试邮件">
            <div class="test-email">
              <el-input v-model="testEmail" placeholder="输入测试邮箱" style="width: 200px" />
              <el-button @click="sendTestEmail" :loading="testingEmail">发送测试</el-button>
            </div>
          </el-form-item>
          <el-divider content-position="left">邮件模板</el-divider>
          <el-form-item label="注册欢迎邮件">
            <el-switch v-model="config.email.welcomeEmail" />
          </el-form-item>
          <el-form-item label="密码重置邮件">
            <el-switch v-model="config.email.passwordResetEmail" />
          </el-form-item>
          <el-form-item label="复习提醒邮件">
            <el-switch v-model="config.email.reviewReminderEmail" />
          </el-form-item>
          <el-form-item label="每日学习报告">
            <el-switch v-model="config.email.dailyReportEmail" />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 短信设置 -->
      <el-tab-pane label="短信设置" name="sms">
        <el-form label-width="140px" class="config-form">
          <el-divider content-position="left">服务商配置</el-divider>
          <el-form-item label="短信服务商">
            <el-select v-model="config.sms.provider" style="width: 200px">
              <el-option label="阿里云短信" value="aliyun" />
              <el-option label="腾讯云短信" value="tencent" />
              <el-option label="华为云短信" value="huawei" />
              <el-option label="容联云通讯" value="yuntongxun" />
            </el-select>
          </el-form-item>
          <el-form-item label="AccessKey ID">
            <el-input v-model="config.sms.accessKeyId" placeholder="AccessKey ID" />
          </el-form-item>
          <el-form-item label="AccessKey Secret">
            <el-input v-model="config.sms.accessKeySecret" type="password" show-password placeholder="AccessKey Secret" />
          </el-form-item>
          <el-form-item label="签名名称">
            <el-input v-model="config.sms.signName" placeholder="如：【学习平台】" />
          </el-form-item>
          <el-form-item label="模板 ID">
            <el-input v-model="config.sms.templateId" placeholder="短信模板 ID" />
          </el-form-item>
          <el-divider content-position="left">发送设置</el-divider>
          <el-form-item label="验证码长度">
            <el-input-number v-model="config.sms.codeLength" :min="4" :max="8" />
          </el-form-item>
          <el-form-item label="验证码有效期">
            <el-input-number v-model="config.sms.codeExpire" :min="60" :max="600" />
            <span class="form-unit">秒</span>
          </el-form-item>
          <el-form-item label="每日发送上限">
            <el-input-number v-model="config.sms.dailyLimit" :min="5" :max="50" />
            <span class="form-unit">条/用户</span>
          </el-form-item>
          <el-form-item label="发送间隔">
            <el-input-number v-model="config.sms.sendInterval" :min="30" :max="300" />
            <span class="form-unit">秒</span>
          </el-form-item>
          <el-divider content-position="left">短信类型</el-divider>
          <el-form-item label="注册验证码">
            <el-switch v-model="config.sms.verifyCodeEnabled" />
          </el-form-item>
          <el-form-item label="登录验证码">
            <el-switch v-model="config.sms.loginVerifyEnabled" />
          </el-form-item>
          <el-form-item label="密码重置">
            <el-switch v-model="config.sms.passwordResetEnabled" />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 支付设置 -->
      <el-tab-pane label="支付设置" name="payment">
        <el-form label-width="140px" class="config-form">
          <el-divider content-position="left">支付方式</el-divider>
          <el-form-item label="支付宝">
            <el-switch v-model="config.payment.alipayEnabled" />
          </el-form-item>
          <el-form-item v-if="config.payment.alipayEnabled" label="AppID">
            <el-input v-model="config.payment.alipayAppId" placeholder="支付宝 AppID" />
          </el-form-item>
          <el-form-item v-if="config.payment.alipayEnabled" label="公钥">
            <el-input v-model="config.payment.alipayPublicKey" type="textarea" :rows="3" placeholder="支付宝公钥" />
          </el-form-item>
          <el-form-item v-if="config.payment.alipayEnabled" label="私钥">
            <el-input v-model="config.payment.alipayPrivateKey" type="password" show-password placeholder="支付宝私钥" />
          </el-form-item>
          <el-form-item label="微信支付">
            <el-switch v-model="config.payment.wechatEnabled" />
          </el-form-item>
          <el-form-item v-if="config.payment.wechatEnabled" label="AppID">
            <el-input v-model="config.payment.wechatAppId" placeholder="微信 AppID" />
          </el-form-item>
          <el-form-item v-if="config.payment.wechatEnabled" label="MchID">
            <el-input v-model="config.payment.wechatMchId" placeholder="商户号" />
          </el-form-item>
          <el-form-item v-if="config.payment.wechatEnabled" label="API密钥">
            <el-input v-model="config.payment.wechatApiKey" type="password" show-password placeholder="API密钥" />
          </el-form-item>
          <el-form-item label="Stripe">
            <el-switch v-model="config.payment.stripeEnabled" />
          </el-form-item>
          <el-form-item v-if="config.payment.stripeEnabled" label="Publishable Key">
            <el-input v-model="config.payment.stripePublishableKey" placeholder="Stripe Publishable Key" />
          </el-form-item>
          <el-form-item v-if="config.payment.stripeEnabled" label="Secret Key">
            <el-input v-model="config.payment.stripeSecretKey" type="password" show-password placeholder="Stripe Secret Key" />
          </el-form-item>
          <el-divider content-position="left">支付设置</el-divider>
          <el-form-item label="货币类型">
            <el-select v-model="config.payment.currency" style="width: 150px">
              <el-option label="人民币 (CNY)" value="CNY" />
              <el-option label="美元 (USD)" value="USD" />
              <el-option label="欧元 (EUR)" value="EUR" />
            </el-select>
          </el-form-item>
          <el-form-item label="支付回调地址">
            <el-input v-model="config.payment.notifyUrl" placeholder="支付成功回调地址" />
          </el-form-item>
          <el-form-item label="支付超时时间">
            <el-input-number v-model="config.payment.timeout" :min="300" :max="3600" />
            <span class="form-unit">秒</span>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 存储设置 -->
      <el-tab-pane label="存储设置" name="storage">
        <el-form label-width="140px" class="config-form">
          <el-divider content-position="left">存储方式</el-divider>
          <el-form-item label="存储类型">
            <el-radio-group v-model="config.storage.type">
              <el-radio label="local">本地存储</el-radio>
              <el-radio label="oss">阿里云 OSS</el-radio>
              <el-radio label="cos">腾讯云 COS</el-radio>
              <el-radio label="obs">华为云 OBS</el-radio>
              <el-radio label="s3">AWS S3 / compatible</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-divider v-if="config.storage.type === 'oss'" content-position="left">阿里云 OSS</el-divider>
          <el-form-item v-if="config.storage.type === 'oss'" label="AccessKey ID">
            <el-input v-model="config.storage.ossAccessKeyId" placeholder="AccessKey ID" />
          </el-form-item>
          <el-form-item v-if="config.storage.type === 'oss'" label="AccessKey Secret">
            <el-input v-model="config.storage.ossAccessKeySecret" type="password" show-password placeholder="AccessKey Secret" />
          </el-form-item>
          <el-form-item v-if="config.storage.type === 'oss'" label="Bucket">
            <el-input v-model="config.storage.ossBucket" placeholder="Bucket 名称" />
          </el-form-item>
          <el-form-item v-if="config.storage.type === 'oss'" label="地域">
            <el-input v-model="config.storage.ossRegion" placeholder="如：oss-cn-beijing" />
          </el-form-item>
          <el-form-item v-if="config.storage.type === 'oss'" label="域名">
            <el-input v-model="config.storage.ossDomain" placeholder="自定义域名，可不填" />
          </el-form-item>
          <el-divider v-if="config.storage.type === 'cos'" content-position="left">腾讯云 COS</el-divider>
          <el-form-item v-if="config.storage.type === 'cos'" label="SecretID">
            <el-input v-model="config.storage.cosSecretId" placeholder="SecretID" />
          </el-form-item>
          <el-form-item v-if="config.storage.type === 'cos'" label="SecretKey">
            <el-input v-model="config.storage.cosSecretKey" type="password" show-password placeholder="SecretKey" />
          </el-form-item>
          <el-form-item v-if="config.storage.type === 'cos'" label="Bucket">
            <el-input v-model="config.storage.cosBucket" placeholder="Bucket 名称" />
          </el-form-item>
          <el-form-item v-if="config.storage.type === 'cos'" label="地域">
            <el-input v-model="config.storage.cosRegion" placeholder="如：ap-beijing" />
          </el-form-item>
          <el-divider content-position="left">存储策略</el-divider>
          <el-form-item label="文件大小限制">
            <el-input-number v-model="config.storage.maxFileSize" :min="1" :max="5000" />
            <span class="form-unit">MB</span>
          </el-form-item>
          <el-form-item label="文件类型限制">
            <el-input v-model="config.storage.allowedTypes" placeholder="如：jpg,png,gif,mp4,pdf" />
          </el-form-item>
          <el-form-item label="自动删除临时文件">
            <el-switch v-model="config.storage.autoCleanTemp" />
          </el-form-item>
          <el-form-item v-if="config.storage.autoCleanTemp" label="保留天数">
            <el-input-number v-model="config.storage.tempRetentionDays" :min="1" :max="30" />
            <span class="form-unit">天</span>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 公告管理 -->
      <el-tab-pane label="公告管理" name="notice">
        <div class="notice-section">
          <div class="notice-header">
            <el-button type="primary" @click="addNotice">
              <el-icon><Plus /></el-icon>
              添加公告
            </el-button>
          </div>
          <el-table :data="config.notices" border stripe class="notice-table">
            <el-table-column prop="title" label="标题" min-width="150" />
            <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getNoticeType(row.type)">{{ getNoticeTypeLabel(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="display" label="显示" width="80">
              <template #default="{ row }">
                <el-switch v-model="row.display" @change="toggleNoticeDisplay(row)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row, $index }">
                <el-button type="primary" link @click="editNotice(row)">编辑</el-button>
                <el-button type="danger" link @click="deleteNotice($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 高级设置 -->
      <el-tab-pane label="高级设置" name="advanced">
        <el-form label-width="140px" class="config-form">
          <el-divider content-position="left">系统维护</el-divider>
          <el-form-item label="维护模式">
            <el-switch v-model="config.advanced.maintenanceMode" />
            <span class="form-hint">开启后普通用户无法访问前台</span>
          </el-form-item>
          <el-form-item v-if="config.advanced.maintenanceMode" label="维护公告">
            <el-input v-model="config.advanced.maintenanceMessage" type="textarea" :rows="3" placeholder="维护公告内容" />
          </el-form-item>
          <el-form-item label="允许的IP访问">
            <el-input v-model="config.advanced.maintenanceAllowIPs" type="textarea" :rows="2" placeholder="维护模式下允许访问的IP，每行一个" />
          </el-form-item>
          <el-divider content-position="left">性能优化</el-divider>
          <el-form-item label="缓存类型">
            <el-radio-group v-model="config.advanced.cacheType">
              <el-radio label="memory">内存</el-radio>
              <el-radio label="redis">Redis</el-radio>
              <el-radio label="local">本地文件</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="Redis 地址">
            <el-input v-model="config.advanced.redisHost" placeholder="redis://localhost:6379" />
          </el-form-item>
          <el-form-item label="缓存时间">
            <el-input-number v-model="config.advanced.cacheTTL" :min="60" :max="86400" />
            <span class="form-unit">秒</span>
          </el-form-item>
          <el-form-item label="开启Gzip压缩">
            <el-switch v-model="config.advanced.gzipEnabled" />
          </el-form-item>
          <el-form-item label="CDN域名">
            <el-input v-model="config.advanced.cdnDomain" placeholder="如：cdn.example.com" />
          </el-form-item>
          <el-form-item label="静态资源CDN">
            <el-switch v-model="config.advanced.staticCdn" />
          </el-form-item>
          <el-divider content-position="left">调试与日志</el-divider>
          <el-form-item label="调试模式">
            <el-switch v-model="config.advanced.debugMode" />
            <span class="form-hint">开启后显示详细错误信息</span>
          </el-form-item>
          <el-form-item label="日志级别">
            <el-select v-model="config.advanced.logLevel" style="width: 150px">
              <el-option label="DEBUG" value="debug" />
              <el-option label="INFO" value="info" />
              <el-option label="WARN" value="warn" />
              <el-option label="ERROR" value="error" />
            </el-select>
          </el-form-item>
          <el-form-item label="日志保留天数">
            <el-input-number v-model="config.advanced.logRetentionDays" :min="7" :max="365" />
            <span class="form-unit">天</span>
          </el-form-item>
          <el-form-item label="SQL日志">
            <el-switch v-model="config.advanced.sqlLog" />
            <span class="form-hint">记录所有SQL执行语句</span>
          </el-form-item>
          <el-divider content-position="left">系统信息</el-divider>
          <el-form-item label="系统版本">
            <el-input v-model="config.advanced.version" disabled />
          </el-form-item>
          <el-form-item label="环境">
            <el-input v-model="config.advanced.environment" disabled />
          </el-form-item>
          <el-form-item label="PHP版本">
            <el-input v-model="config.advanced.phpVersion" disabled />
          </el-form-item>
          <el-form-item label="数据库类型">
            <el-input v-model="config.advanced.database" disabled />
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <!-- 添加/编辑公告对话框 -->
    <el-dialog v-model="noticeDialogVisible" :title="editingNotice ? '编辑公告' : '添加公告'" width="500px">
      <el-form :model="noticeForm" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="noticeForm.title" placeholder="公告标题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="noticeForm.content" type="textarea" :rows="4" placeholder="公告内容" />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="noticeForm.type">
            <el-radio label="info">通知</el-radio>
            <el-radio label="warning">警告</el-radio>
            <el-radio label="success">成功</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="显示">
          <el-switch v-model="noticeForm.display" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="noticeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveNotice">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { DocumentChecked, Plus } from '@element-plus/icons-vue'

const activeTab = ref('website')
const saving = ref(false)
const testingEmail = ref(false)
const testEmail = ref('')
const noticeDialogVisible = ref(false)
const editingNotice = ref<any>(null)

const noticeForm = reactive({
  title: '',
  content: '',
  type: 'info' as 'info' | 'warning' | 'success',
  display: true
})

// 模拟配置数据
const config = reactive({
  website: {
    name: '在线学习平台',
    title: '英语学习与复习系统',
    description: '一个专注于英语词汇学习和复习的系统，采用艾宾浩斯遗忘曲线帮助学生科学记忆单词。',
    keywords: '英语学习,词汇记忆,艾宾浩斯遗忘曲线,复习系统',
    email: 'admin@example.com',
    phone: '400-123-4567',
    icp: '京ICP备12345678号',
    copyright: '© 2024 cwwdka. All rights reserved.',
    sitemapEnabled: true,
    robots: 'User-agent: *\nAllow: /',
    canonicalUrl: ''
  },
  upload: {
    imageMaxSize: 10,
    imageTypes: ['jpg', 'png', 'gif', 'webp'],
    imageCompression: false,
    compressionQuality: 80,
    videoMaxSize: 500,
    videoTypes: ['mp4', 'avi', 'mov'],
    videoTranscode: false,
    watermarkEnabled: false,
    watermarkPosition: 'bottom-right',
    watermarkOpacity: 50
  },
  user: {
    allowRegister: true,
    registerType: 'email',
    registerVerify: true,
    registerReview: false,
    rememberLogin: true,
    rememberDays: 7,
    loginCaptcha: false,
    loginLock: true,
    lockThreshold: 5,
    lockMinutes: 30,
    defaultAvatar: 'system',
    avatarMaxSize: 500,
    allowChangeUsername: false,
    requiredFields: ['nickname']
  },
  security: {
    forcePasswordChange: false,
    passwordMinLength: 8,
    passwordComplexity: true,
    passwordExpireDays: 0,
    passwordHistory: 5,
    sessionTimeout: 120,
    allowMultiLogin: true,
    kickOtherDevice: true,
    ipBlacklist: '',
    ipWhitelist: '',
    proxyDetect: false,
    dataEncryption: true,
    dataMasking: true,
    auditLog: true,
    logRetentionDays: 90
  },
  review: {
    enabled: true,
    intervals: [1, 7, 30],
    dailyNewWords: 20,
    dailyReviewLimit: 100,
    reminderTime: '09:00',
    reminderEnabled: true,
    reminderWays: ['browser'],
    pointsEnabled: true,
    pointsPerCorrect: 5,
    pointsPerWrong: 0,
    streakBonus: 10,
    streakThreshold: 7,
    showStatistics: true,
    showLeaderboard: true,
    dataExport: true
  },
  email: {
    smtpHost: 'smtp.qq.com',
    smtpPort: 465,
    smtpEncryption: 'ssl',
    smtpUser: '',
    smtpPassword: '',
    fromName: '系统管理员',
    fromEmail: 'admin@example.com',
    replyTo: '',
    welcomeEmail: true,
    passwordResetEmail: true,
    reviewReminderEmail: true,
    dailyReportEmail: false
  },
  sms: {
    provider: 'aliyun',
    accessKeyId: '',
    accessKeySecret: '',
    signName: '',
    templateId: '',
    codeLength: 6,
    codeExpire: 300,
    dailyLimit: 10,
    sendInterval: 60,
    verifyCodeEnabled: true,
    loginVerifyEnabled: false,
    passwordResetEnabled: true
  },
  payment: {
    alipayEnabled: false,
    alipayAppId: '',
    alipayPublicKey: '',
    alipayPrivateKey: '',
    wechatEnabled: false,
    wechatAppId: '',
    wechatMchId: '',
    wechatApiKey: '',
    stripeEnabled: false,
    stripePublishableKey: '',
    stripeSecretKey: '',
    currency: 'CNY',
    notifyUrl: '',
    timeout: 1800
  },
  storage: {
    type: 'local',
    ossAccessKeyId: '',
    ossAccessKeySecret: '',
    ossBucket: '',
    ossRegion: '',
    ossDomain: '',
    cosSecretId: '',
    cosSecretKey: '',
    cosBucket: '',
    cosRegion: '',
    maxFileSize: 100,
    allowedTypes: 'jpg,jpeg,png,gif,mp4,pdf,doc,docx,xls,xlsx',
    autoCleanTemp: true,
    tempRetentionDays: 7
  },
  notices: [
    { title: '系统升级通知', content: '系统将于今晚22:00进行升级维护，预计持续30分钟。', type: 'warning', display: true },
    { title: '新功能上线', content: '新增AI智能复习功能，个性化定制你的学习计划！', type: 'success', display: true },
    { title: '学习打卡活动', content: '参与每日学习打卡，连续7天可获得积分奖励。', type: 'info', display: true }
  ],
  advanced: {
    maintenanceMode: false,
    maintenanceMessage: '系统正在维护中，请稍后再访问。',
    maintenanceAllowIPs: '',
    cacheType: 'memory',
    redisHost: 'redis://localhost:6379',
    cacheTTL: 3600,
    gzipEnabled: true,
    cdnDomain: '',
    staticCdn: false,
    debugMode: false,
    logLevel: 'info',
    logRetentionDays: 30,
    sqlLog: false,
    version: '1.0.0',
    environment: 'production',
    phpVersion: '8.2',
    database: 'MySQL 8.0'
  }
})

const saveConfig = async () => {
  saving.value = true
  await new Promise(resolve => setTimeout(resolve, 1000))
  saving.value = false
  ElMessage.success('配置保存成功')
}

const sendTestEmail = async () => {
  if (!testEmail.value) {
    ElMessage.warning('请输入测试邮箱')
    return
  }
  testingEmail.value = true
  await new Promise(resolve => setTimeout(resolve, 1500))
  testingEmail.value = false
  ElMessage.success('测试邮件已发送')
}

const getNoticeType = (type: string) => {
  const map: Record<string, string> = {
    info: 'primary',
    warning: 'warning',
    success: 'success'
  }
  return map[type] || 'info'
}

const getNoticeTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    info: '通知',
    warning: '警告',
    success: '成功'
  }
  return map[type] || '通知'
}

const addNotice = () => {
  editingNotice.value = null
  Object.assign(noticeForm, {
    title: '',
    content: '',
    type: 'info',
    display: true
  })
  noticeDialogVisible.value = true
}

const editNotice = (row: any) => {
  editingNotice.value = row
  Object.assign(noticeForm, row)
  noticeDialogVisible.value = true
}

const saveNotice = () => {
  if (!noticeForm.title || !noticeForm.content) {
    ElMessage.warning('请填写完整信息')
    return
  }
  if (editingNotice.value) {
    Object.assign(editingNotice.value, noticeForm)
  } else {
    config.notices.push({ ...noticeForm })
  }
  noticeDialogVisible.value = false
  ElMessage.success('公告保存成功')
}

const deleteNotice = (index: number) => {
  config.notices.splice(index, 1)
  ElMessage.success('公告已删除')
}

const toggleNoticeDisplay = (row: any) => {
  ElMessage.success(row.display ? '公告已显示' : '公告已隐藏')
}
</script>

<style scoped lang="scss">
.system-config {
  padding: 20px;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }
}

.config-tabs {
  :deep(.el-tabs__content) {
    padding: 20px;
  }
}

.config-form {
  max-width: 900px;

  .el-divider {
    margin: 24px 0 16px;
    color: #909399;
    font-weight: 500;
  }

  .form-unit {
    margin-left: 8px;
    color: #909399;
    font-size: 13px;
  }

  .form-hint {
    margin-left: 12px;
    color: #909399;
    font-size: 12px;
  }

  .interval-inputs {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;

    .el-input-number {
      width: 90px;
    }

    span {
      color: #606266;
      font-size: 13px;
    }

    .arrow {
      color: #909399;
    }
  }
}

.notice-section {
  .notice-header {
    margin-bottom: 16px;
  }

  .notice-table {
    width: 100%;
  }
}

.test-email {
  display: flex;
  gap: 12px;
}

:deep(.el-checkbox-group),
:deep(.el-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>