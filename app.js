//app.js
App({
  onLaunch: function() {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
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
                  this.globalData.userInfo = res.userInfo
                  this.globalData.hasUserInfo = true
                  if (!this.checkIsLogin()) {
                    this.getToken(code, res.encryptedData, res.iv);
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
    wx.getSystemInfo({
      success: e => {
        this.globalData.StatusBar = e.statusBarHeight;
        let capsule = wx.getMenuButtonBoundingClientRect();
        if (capsule) {
         	this.globalData.Custom = capsule;
        	// this.globalData.CustomBar = capsule.bottom + capsule.top - e.statusBarHeight;
          this.globalData.CustomBar = capsule.top + e.statusBarHeight;
        } else {
        	this.globalData.CustomBar = e.statusBarHeight + 50;
        }
      }
    })
  },
  globalData: {
    userInfo: null,
    hasUserInfo: false,
    // apiDomain: 'http://api.buling.club/api', //测试
    apiDomain: 'https://snap-mark.buling.club/api', //生产
  },
  
  //全局统一调用接口的方法
  apiRequest: function (options) {
    wx.request({
      url: this.globalData.apiDomain + options.url,
      method: options.method ? options.method : 'GET',
      header: {
        'Authorization': 'Bearer ' + wx.getStorageSync('token'),
        'Accept': 'application/json',
      },
      dataType: 'json',
      data: options.data,
      success: res => {
        switch (res.statusCode) {
          case 200:
            options.success(res);
            break;
          case 401:
            this.toLogin();
            break;
          case 422:
            break;
          case 404:
            wx.showToast({
              title: '请求地址不存在',
              icon: 'none'
            })
            break;
          default:
            wx.showToast({
              title: '出错了～请稍后再试',
              icon: 'none'
            })
        }
      },
      fail: res => {
        if (options.fail) {
          options.fail(res);
        }
      },
      complete: res => {
        if (options.complete) {
          options.complete(res);
        }
      }
    });
  },

  /**
     * 验证登录
     */
  checkIsLogin(autoLogin = false) {
    if (wx.getStorageSync('token') != '') {
      return true;
    }
    if (autoLogin) {
      this.toLogin();
    } else {
      return false;
    }
  },

  /**
   * 跳转登陆页
   */
  toLogin() {
    wx.navigateTo({
      url: '../login/login',
    });
  },

  /**
   * 获取token
   */
  getToken(code, encryptedData, iv, callback = null) {
    //调后端接口获取token
    this.apiRequest({
      url: '/login',
      method: 'POST',
      data: {
        'code': code,
        'data': encryptedData,
        'iv': iv
      },
      success: res => {
        wx.setStorageSync('token', res.data.token);
        callback && callback();
      }
    });
  },

  /**
   * 授权登录
   */
  getUserInfo(e, callback) {
    let App = this;
    if (e.detail.errMsg !== 'getUserInfo:ok') {
      wx.showToast({
        title: '未授权，登录失败',
        icon: 'none'
      })
      return false;
    }
    wx.showLoading({
      title: "正在登录",
      mask: true
    });
    // 执行微信登录
    wx.login({
      success(res) {
        var code = res.code;
        wx.getUserInfo({
          success: res => {
            // 可以将 res 发送给后台解码出 unionId
            App.globalData.userInfo = res.userInfo
            App.globalData.hasUserInfo = true
            //调后端接口获取token
            App.getToken(code, res.encryptedData, res.iv, res => {
              wx.hideLoading();
            });
            callback && callback(res);
          },
          fail: res => {
            console.log(res)
          }
        })
      }
    });
  },

  // 设置监听器
  watch: function (ctx, obj) {
    Object.keys(obj).forEach(key => {
      this.observer(ctx.data, key, ctx.data[key], function (value) {
        obj[key].call(ctx, value)
      })
    })
  },
  // 监听属性，并执行监听函数
  observer: function (data, key, val, fn) {
    Object.defineProperty(data, key, {
      configurable: true,
      enumerable: true,
      get: function () {
        return val
      },
      set: function (newVal) {
        if (newVal === val) return
        fn && fn(newVal)
        val = newVal
      },
    })
  }
})