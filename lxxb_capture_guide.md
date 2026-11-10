# 灵犀晓伴 App 抓包指南

## 一、准备工作

### 1. 确认QX已开启MITM
- 打开 QuantumultX → 设置 → MITM
- 确认 MITM 已**开启**
- 如果没有CA证书，点击「生成CA证书」
- 到 iOS 设置 → 通用 → VPN与设备管理 → 安装QX的CA证书
- 到 iOS 设置 → 通用 → 关于本机 → 证书信任设置 → **开启QX证书的完全信任**

### 2. 导入脚本
- 将 `QuantumultX/scripts/lxxb_capture.js` 放入QX的脚本目录
- 如果你用iCloud同步QX配置，放到对应的iCloud文件夹里

### 3. 导入配置
有两种方式：

**方式A：手动复制（推荐）**
- 打开 `lxxb_capture.conf`，把里面的 `[mitm]` 和 `[rewrite_local]` 内容
- 合并到你的 QX 主配置文件中对应的部分
- 保存并重载配置

**方式B：引用远程文件**
- 把 `lxxb_capture.conf` 上传到你的GitHub或任何可访问的URL
- 在QX主配置的 `[resource_remote]` 中引用

---

## 二、开始抓包

### 操作步骤

打开QX日志窗口（QX主界面底部 → **日志**），然后按以下顺序操作晓伴App：

#### 第一步：抓登录流程（最重要）
1. 先退出晓伴App的登录状态
2. 重新打开App，输入手机号
3. 点击获取验证码
4. 输入验证码完成登录
5. **关注日志中标记为 📤[请求] 的内容**
6. 重点找这几个接口：
   - 发送验证码的接口（通常包含 `sms`、`code`、`verify` 等关键词）
   - 验证码登录接口（通常包含 `login`、`auth`、`token` 等关键词）
   - 登录成功后的响应体中的 Token/Cookie

#### 第二步：抓签到接口
1. 进入晓伴App首页
2. 找到「好礼同行」活动入口
3. 点击「体验有礼」完成签到
4. 日志中找包含 `sign`、`checkin`、`check`、`task` 等关键词的请求

#### 第三步：抓话费优惠充接口
1. 在App内搜索或对话输入「充话费」
2. 点击「话费优惠充」进入活动页面
3. **不需要真的充值**，只看到活动页面即可
4. 日志中找包含 `recharge`、`coupon`、`voucher`、`activity` 等关键词的请求

#### 第四步：抓灵犀口令接口
1. 进入App底部「灵犀」
2. 输入当天口令（如「福利好惊喜」）
3. 看到抽奖结果即可
4. 日志中找包含 `lottery`、`lucky`、`command`、`keyword` 等关键词的请求

#### 第五步：抓用户信息接口
1. 进入「我的」或「个人中心」页面
2. 日志中找包含 `user`、`info`、`profile`、`account`、`balance` 等关键词的请求
3. 这个接口能告诉我们用户的Token余额、话费余额等信息

---

## 三、整理接口数据

抓包完成后，从QX日志中提取以下信息，整理成这个格式给我：

```
### 1. 登录 - 发送验证码
- URL: https://xxx.lxxb.com/api/xxx/sms
- Method: POST
- 请求头关键字段:
  - Content-Type: application/json
  - User-Agent: xxx
- 请求体: {"phone": "138xxxx1234"}
- 响应体: {"code": 0, "msg": "success"}

### 2. 登录 - 验证码登录
- URL: https://xxx.lxxb.com/api/xxx/login
- Method: POST
- 请求头关键字段:
  - Content-Type: application/json
- 请求体: {"phone": "138xxxx1234", "code": "1234"}
- 响应体: {"code": 0, "data": {"token": "xxx", "userId": "xxx"}}

### 3. 签到
- URL: https://xxx.lxxb.com/api/xxx/sign
- Method: POST
- 请求头关键字段:
  - Authorization: Bearer xxx
  - Cookie: xxx
- 请求体: {}
- 响应体: {"code": 0, "data": {"reward": "10000000 tokens"}}

...（以此类推）
```

---

## 四、常见问题

### Q: 日志里没有任何请求？
- 确认QX已开启（主界面开关打开）
- 确认MITM已开启
- 确认CA证书已安装并信任
- 确认晓伴App的域名在hostname列表中
- 尝试把hostname改为 `*` 测试（临时抓所有流量）
- 杀掉晓伴App重新打开

### Q: 抓到了但看不懂？
- 不用管，把日志截图或复制发给我
- 我来分析哪些是关键接口

### Q: 某些请求抓不到？
- 晓伴App可能用了非标准域名
- 在QX的MITM设置里把hostname改为 `*` 抓所有流量
- 然后重新操作一遍

### Q: 抓包会封号吗？
- 抓包只是**观察**请求，不会修改任何数据
- 只要不在短时间内疯狂重复请求，不会有风险
- 正常手动操作一遍App即可

---

## 五、文件清单

| 文件 | 用途 |
|------|------|
| `QuantumultX/scripts/lxxb_capture.js` | 抓包脚本，拦截并打印请求/响应 |
| `lxxb_capture.conf` | QX配置文件，定义hostname和rewrite规则 |
| `lxxb_capture_guide.md` | 本指南 |

---

## 六、下一步

把抓到的接口信息发给我后，我会：
1. 分析接口的认证机制（Token/Cookie如何获取和刷新）
2. 设计Web管理端的架构
3. 开发后端（Node.js，管理7个号码的Token和活动执行）
4. 开发前端（号码状态面板、批量执行、历史记录）
5. 本地部署运行
