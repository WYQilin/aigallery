//index.js
//获取应用实例
const app = getApp()
const utils = require("../../utils/util.js")

Page({
  data: {
    StatusBar: app.globalData.StatusBar,
    CustomBar: app.globalData.CustomBar,
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    defaultAvatar: '/assets/images/avatar/1.jpg',
    date: null,
    slogan: null,
    posters: [],
    maxLikeNum: 3,
    showLikeMessage: null,
    likeMessageList: {
      "like1": "真的喜欢我吗？再点击一次会有惊喜",
      "like2": "看到了吗？是不是变颜色了？",
      "like3": "想知道能变多少次吗？ 实在闲的没事就再试",
      "like4": "感觉身体被掏空， 放过我吧！"
    },
    showBottomModal: false,
  },

  onLoad: function () {
    //设置默认头像
    this.setData({
      defaultAvatar: '/assets/images/avatar/' + Math.ceil(Math.random() * 5) + '.jpg',
    })
    
    this.getDate()
    this.getSlogan();
    this.getPosterList();
  },

  onShow: function() {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },

  //下拉刷新
  onPullDownRefresh: function() {
    this.getSlogan();
    this.getPosterList()
    wx.vibrateShort()
    wx.showToast({
      title: '刷新成功',
    })
    wx.stopPullDownRefresh()
  },

  //获取顶部日期
  getDate: function() {
    var today = utils.today();
    this.setData({
      date: today.month + '月' + today.day + '日 ' + today.week 
    })
  },

  //获取用户信息
  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },

  //获取海报列表
  getPosterList: function() {
    app.apiRequest({
      url: '/posters',
      success: (res) => {
        console.log(res)
        this.setData({
          posters: res.data.data
        })
      }
    })
  },

  //获取每日一话
  getSlogan: function() {
    app.apiRequest({
      url: '/slogans/last',
      method: 'GET',
      success: res => {
        console.log(res)
        this.setData({
          slogan: res.data
        })
      }
    })
  },

  //展示点赞卡片提示
  toastLikeMessage(count) {
    wx.vibrateShort()
    this.setData({
      showLikeMessage: "like" + (count <= 4 ? count : 4),
    })
    setTimeout(res => {
      this.setData({
        showLikeMessage: null,
      })
    }, 1000);
  },

  //事件：点赞
  bindLike: function (event) {
    var index = parseInt(event.currentTarget.dataset.index);
    var posterId = parseInt(event.currentTarget.dataset.posterId);
    var like = parseInt(event.currentTarget.dataset.like) + 1;
    
    //四次后不再请求接口
    if (like > 4) {
      //展示卡片提示
      this.toastLikeMessage(like);
      return;
    }
    
    app.apiRequest({
      url: '/like/toggle',
      method: 'POST',
      data: {
        'id': posterId,
        'type': 'poster',
        'count': like
      },
      success: res => {
        this.data.posters[index].like = like;
        this.data.posters[index].like_sum = parseInt(this.data.posters[index].like_sum) + 1;
        this.setData({
          posters: this.data.posters
        })
        //展示卡片提示
        this.toastLikeMessage(like);
      },
    })
  },

  //事件：保存图片
  bindSaveImage: function(event){
    var url = event.currentTarget.dataset.image;
    //用户需要授权
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.writePhotosAlbum']) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => {
              // 同意授权
              this.saveImage(url);
            },
            fail: (res) => {
              console.log(res);
              wx.showToast({
                title: '请先授权',
                icon: 'none'
              })
              this.setData({
                showBottomModal: true
              })
            }
          })
        } else {
          // 已经授权过
          this.saveImage(url);
        }
      },
      fail: (res) => {
        console.log(res);
      }
    })
  },
  
  //保存图片
  saveImage: function(imageUrl) {
    console.log(imageUrl)
    wx.showLoading({
      title: '保存中...',
      mask: true,
    });
    wx.downloadFile({
      url: imageUrl,
      success: res => {
        if (res.statusCode === 200) {
          console.log(res)
          let img = res.tempFilePath;
          wx.saveImageToPhotosAlbum({
            filePath: img,
            success: res => {
              wx.showToast({
                title: '保存成功',
                icon: 'success',
                duration: 2000
              });
            },
            fail: res => {
              wx.showToast({
                title: '保存失败',
                icon: 'none',
                duration: 2000
              });
            }
          });
        }else{
          console.log(res)
          wx.showToast({
            title: '保存失败',
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: res => {
        console.log(res)
        wx.showToast({
          title: '下载失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },
  hideBottomModal: function() {
    this.setData({
      showBottomModal: false
    })
  },
  onShareAppMessage: function(res) {
    console.log(res)
    if (res.from == 'button') {
      return {
        title: this.data.slogan.content,
        imageUrl: res.target.dataset.image
      }
    } else {
      return {
        title: this.data.slogan.content,
        imageUrl: '/assets/images/share-banner.jpg'
      }
    }
  }
})
