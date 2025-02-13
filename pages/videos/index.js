const http = require('../../utils/http.js')
const app = getApp()
Page({
  data: {
    safeHeight: app.globalData.safeHeight,
    videos: [],
    videoPage: 1,
    videoLoading: false,
    videoHasMoreData: true,
    showBottomModal: false,
    downloadUrl: null,
  },
  
  onLoad: function () {
    this.getVideoList();
  },

  onShow: function() {

  },

  //下拉刷新
  onPullDownRefresh: function() {
    this.setData({
      videos: [],
      videoPage: 1,
      videoLoading: false,
    })
    this.getVideoList()
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
    if (this.data.videoHasMoreData) {
      this.setData({
        videoPage: this.data.videoPage + 1
      })
      this.getVideoList();
    }
  },

  //获取海报列表
  getVideoList: function() {
    this.setData({
      videoLoading: true
    })
    wx.showLoading({
      title: '加载中...',
    })
    http.request({
      url: '/api/videos',
      data: {
        page: this.data.videoPage
      },
      success: (res) => {
        this.setData({
          videos: this.data.videos.concat(res.data.data),
          videoPage: res.data.current_page,
          videoHasMoreData: Boolean(res.data.next_page_url)
        })
      },
      complete: (res) => {
        this.setData({
          videoLoading: false
        })
        wx.hideLoading();
      }
    })
  },
  bindPublish: function() {
    wx.showToast({
      title: '暂不开源',
      icon: 'error'
    })
  },
  //事件：保存图片
  bindSaveImage: function(event){
    this.setData({
      downloadUrl: event.currentTarget.dataset.url
    })
    //用户需要授权
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.writePhotosAlbum']) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => {
              // 同意授权
              this.saveImageAfterAd();
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
          this.saveImage(event.currentTarget.dataset.url);
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
    // if (!this.data.hasUserInfo) {
    //   return app.toLogin();
    // }
    wx.showLoading({
      title: '保存中...',
      mask: true,
    });
    wx.downloadFile({
      url: imageUrl,
      success: res => {
        if (res.statusCode === 200) {
          let img = res.tempFilePath;
          wx.saveVideoToPhotosAlbum({
            filePath: img,
            success: res => {
              wx.showToast({
                title: '保存成功',
                icon: 'success',
                duration: 2000
              });
            },
            fail: res => {
              console.log(res)
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
  
  },
})
