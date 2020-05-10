//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    StatusBar: app.globalData.StatusBar,
    CustomBar: app.globalData.CustomBar,
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    defaultAvatar: '/assets/images/avatar/1.jpg',
    posters: [],
    maxLikeNum: 3,
    showLikeMessage: null,
    likeMessageList: {
      "like1": "真的喜欢我吗？再点击一次会有惊喜",
      "like2": "看到了吗？是不是变颜色了？",
      "like3": "想知道能变多少次吗？ 实在闲的没事就再试",
      "like4": "感觉身体被掏空， 放过我吧！"
    }
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function () {
    //设置默认头像
    this.setData({
      defaultAvatar: '/assets/images/avatar/' + Math.ceil(Math.random() * 5) + '.jpg',
    })

    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
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

    this.getPosterList();
  },
  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
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

  //点赞绑定事件
  bindLike: function (event) {
    var index = parseInt(event.currentTarget.dataset.index);
    var posterId = parseInt(event.currentTarget.dataset.posterId);
    var like = parseInt(event.currentTarget.dataset.like) + 1;
    
    //展示卡片提示
    this.setData({
      showLikeMessage: "like" + (like <= 4? like : 4),
    })
    setTimeout(res => {
      this.setData({
        showLikeMessage: null,
      })
    }, 1000);

    //四次后不再请求接口
    if (like > 4) {
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
        this.setData({
          posters: this.data.posters
        })
      },
    })
  }
})
