// pages/collection/index.js
//获取应用实例
const http = require('../../utils/http.js')
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    safeHeight: app.globalData.safeHeight,
    posters: [],
    posterPage: 1,
    posterLoading: false,
    posterHasMoreData: true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getCollectionList()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  //获取海报列表
  getCollectionList: function() {
    this.setData({
      posterLoading: true
    })
    wx.showLoading({
      title: '加载中...',
    })
    http.request({
      url: '/api/collections',
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
        this.setData({
          posterLoading: false
        })
        wx.hideLoading();
      }
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.setData({
      posters: [],
      posterPage: 1,
      posterLoading: false,
    }, res => {
      this.getCollectionList()
      wx.vibrateShort()
      wx.showToast({
        title: '刷新成功',
        complete: wx.stopPullDownRefresh()
      })
    }) 
  },

  // 点击图片触发的预览方法
  previewImage(e) {
    console.log(e)
    var imageList = [e.currentTarget.dataset.url]
    for(var i = 0; i < this.data.posters.length; i++) {
      if (this.data.posters[i].group_id == e.currentTarget.dataset.groupid) {
        var tmpImages = this.data.posters[i].images
        imageList = []
        for (var j = 0; j < tmpImages.length; j++) {
          imageList.push(tmpImages[j].url)
        }
      }
    }
    console.log(imageList)
    wx.previewImage({
      current: e.currentTarget.dataset.url, // 当前显示图片的 URL
      urls: imageList, // 需要预览的图片 URL 列表
    });
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    if (this.data.posterHasMoreData) {
      this.setData({
        posterPage: this.data.posterPage + 1
      })
      this.getCollectionList();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})