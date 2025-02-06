const http = {
  Host: function() {
    var domain
    console.log(__wxConfig.envVersion)
    switch (__wxConfig.envVersion) {
      case 'develop':
        domain = 'http://127.0.0.1'
        break
      default:
        domain = 'https://你的域名'
        break
    }
    return domain
  }(),

  //全局统一调用接口的方法
  request: function (options) {
    wx.request({
      url: this.Host + options.url,
      method: options.method ? options.method : 'GET',
      header: {
        'Authorization': 'Bearer ' + wx.getStorageSync('token'),
        'Accept': 'application/json',
      },
      dataType: 'json',
      data: options.data,
      timeout: options.method ? options.method : 10000, // 设置超时时间
      success: res => {
        switch (res.statusCode) {
          case 200:
          case 201:
            options.success(res);
            break;
          case 401:
            wx.clearStorageSync('token')
            // this.toLogin(); // 根据需要，看是否需要强制跳转登陆页
            break;
          case 402: // 需付费
            // 统一提示去充值
            wx.showModal({
              title: '您的积分不足',
              confirmText: '去赚积分',
              complete: (res) => {
                if (res.cancel) {

                }
                if (res.confirm) {
                  wx.navigateTo({
                    url: '/pages/integral/index',
                  })
                }
              }
            })
            break;
          case 409:
            wx.showToast({
              title: res.data.message,
              icon: 'none'
            })
            break;
          case 422:
            // todo: laravel统一422实体错误封装
            if (options.validateFail == undefined) {
              wx.showToast({
                title: res.data.errmsg != undefined ? res.data.errmsg : '提交信息错误,请检查',
                icon: 'none'
              })
            } else {
              options.validateFail(res) // 可自行传递闭包实现页面错误具体交互
            }
            break;
          case 403:
            wx.showToast({
              title: '无权操作',
              icon: 'none'
            })
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

  // 获取token
  getToken(code, encryptedData, iv, callback = null) {
    //调后端接口获取token
    http.request({
      url: '/api/login',
      method: 'POST',
      data: {
        'code': code,
        'data': encryptedData,
        'iv': iv
      },
      success: res => {
        wx.setStorageSync('token', res.data.token);
        wx.setStorageSync('userId', res.data.id);
        wx.setStorageSync('statusId', res.data.status);
        callback && callback(res);
      }
    });
  },

  // 检查是否已登陆
  checkIsLogin(autoJump = false) {
    if (wx.getStorageSync('token') != '') {
      return true;
    }
    if (autoJump) {
      // this.toLogin();
    } else {
      return false;
    }
  }
}
module.exports = http