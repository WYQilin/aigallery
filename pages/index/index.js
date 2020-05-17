//index.js
import Poster from '../../components/canvas-poster/poster/poster';

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
    posterPage: 1,
    posterHasMoreData: true,
    maxLikeNum: 3,
    showLikeMessage: null,
    likeMessageList: {
      "like1": "真的喜欢我吗？再点击一次会有惊喜",
      "like2": "看到了吗？是不是变颜色了？",
      "like3": "想知道能变多少次吗？ 实在闲的没事就再试",
      "like4": "感觉身体被掏空， 放过我吧！"
    },
    showBottomModal: false,
    posterBgColorsList: [
      "#285943",
      "#379392",
      "#00a896",
      "#fca311",
      "#ff206e",
      "#04395e",
      "#9e0059",
      "#0b0b4d",
      "#345995",
      "#e40066",
      "#004346",
      "#004346",
      "#4f0147",
      "#3a015c",
      "#231942",
      "#f7b801",
      "#4b574f",
      "#db093b",
      "#c5d86d",
      "#585123",
      "#586ba4",
      "#1b3c29",
      "#aa4465",
      "#1f2421",
      "#f46036",
      "#513b56",
      "#3c6e71",
      "#ffbc42",
      "#95c623",
    ]
  },
  
  onLoad: function () {
    //设置默认头像
    this.setData({
      defaultAvatar: '/assets/images/avatar/' + Math.ceil(Math.random() * 5) + '.jpg',
    })

    //设置顶部日期
    this.getDate();

    // 调用监听器，监听数据变化
    app.watch(this, {
      userInfo: function (newUserInfo) {
        this.getSlogan(newUserInfo.gender);
      }
    })

    //获取用户信息
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
    
    this.getSlogan();
    this.getPosterList();
  },

  onShow: function() {
    //更新用户信息（登录后返回需要触发用户头像更新）
    if (!this.data.hasUserInfo && app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    }
  },

  //下拉刷新
  onPullDownRefresh: function() {
    this.setData({
      posterPage: 1,
    })
    this.getSlogan(this.data.userInfo.gender);
    this.getPosterList()
    wx.vibrateShort()
    wx.showToast({
      title: '刷新成功',
    })
    wx.stopPullDownRefresh()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.posterHasMoreData) {
      this.setData({
        posterPage: this.data.posterPage + 1
      })
      this.getPosterList();
    }
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
    app.getUserInfo(e, (res)=>{
      console.log(res)
      this.setData({
        userInfo: res.userInfo,
        hasUserInfo: true
      })
    })
  },

  //获取海报列表
  getPosterList: function() {
    wx.showLoading({
      title: '加载中...',
    })
    app.apiRequest({
      url: '/posters',
      data: {
        page: this.data.posterPage
      },
      success: (res) => {
        this.setData({
          posters: this.data.posters.concat(res.data.data),
          posterPage: res.data.current_page,
          posterHasMoreData: Boolean(res.data.next_page_url)
        })
      },
      complete: (res) => {
        wx.hideLoading();
      }
    })
  },

  //获取每日一话
  getSlogan: function(gender = 0) {
    app.apiRequest({
      url: '/slogans/last',
      data: {
        gender: gender
      },
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
    }, 1200);
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
          ["posters[" + index + "]"]: this.data.posters[index], //局部刷新
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
    if (!this.data.hasUserInfo) {
      return app.toLogin();
    }
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
  },

  /**
  * 确认是否生成海报
  */
  onCreatePosterConfirm(event) {
    wx.showModal({
      title: '生成分享海报？',
      success: res => {
        if (res.confirm) {
          if (!this.data.hasUserInfo) {
            return app.toLogin();
          }
          //用户需要授权
          wx.getSetting({
            success: (res) => {
              if (!res.authSetting['scope.writePhotosAlbum']) {
                wx.authorize({
                  scope: 'scope.writePhotosAlbum',
                  success: () => {
                    // 同意授权
                    this.createPoster(event.currentTarget.dataset.image);
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
                this.createPoster(event.currentTarget.dataset.image);
              }
            },
            fail: (res) => {
              console.log(res);
            }
          })
        }
      }
    })
  },

  /**
   * 生成海报
   */
  createPoster(url) {
    wx.showLoading({
      title: '下载中',
    })
    wx.getImageInfo({
      src: url,
      success: res => {
        var width = res.width;
        var height = res.height;
        var codeWith = 160;
        var codeHeight = 220 

        this.setData({
          posterConfig: {
            width: width,
            height: height,
            x: 35,
            y: 210,
            debug: false,
            pixelRatio: 1,
            borderRadius: 20,
            images: [
              {
                width: width,
                height: height,
                x: 0,
                y: 0,
                borderRadius: 20,
                url: url,
              },
              {
                width: codeWith,
                height: codeHeight,
                x: width - codeWith,
                y: height - codeHeight,
                url: '/assets/images/qrcode-fill.png',
              },
            ]
          }
        }, () => {
          Poster.create(true);    // 入参：true为抹掉重新生成
        });
      },
      fail: res => {
        wx.hideLoading();
      }
    })
  },
  onPosterSuccess(e) {
    var image = e.detail;
    wx.saveImageToPhotosAlbum({
      filePath: image,
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
  },
  onPosterFail(err) {
    console.error(err);
  },
})
