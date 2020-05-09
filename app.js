// app.js
const http = require('./utils/http.js')

App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        var code = res.code;
        // 获取用户信息
        wx.getSetting({
          success: res => {
            if (res.authSetting['scope.userInfo']) {
              // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
              wx.getUserInfo({
                success: res => {
                  // 可以将 res 发送给后台解码出 unionId
                  if (!http.checkIsLogin()) {
                    // 每次打开重新获取token
                    var that = this
                    http.getToken(code, res.encryptedData, res.iv, function(tokenRes) {
                      that.globalData.tokenUpdate = true
                      that.globalData.userInfo = tokenRes.data
                      that.globalData.hasUserInfo = true
                    });
                  }

                  // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
                  // 所以此处加入 callback 以防止这种情况
                  if (this.userInfoReadyCallback) {
                    this.userInfoReadyCallback(res)
                  }
                }
              })
            }
          }
        })
      }
    })
    // 获取系统状态栏信息
    const windowInfo = wx.getWindowInfo();
    this.globalData.StatusBar = windowInfo.statusBarHeight;
    let capsule = wx.getMenuButtonBoundingClientRect();
    if (capsule) {
      this.globalData.Custom = capsule;
      this.globalData.CustomBar = capsule.bottom + capsule.top - windowInfo.statusBarHeight;
    } else {
      this.globalData.CustomBar = windowInfo.statusBarHeight + 50;
    }
  },
 
  globalData: {
    userInfo: null,
  }
})
