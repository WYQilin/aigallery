//获取应用实例
const http = require('../../utils/http.js')
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    imagePage: 1,
    imageLoading: false,
    imageHasMoreData: true,
    leftData: [],
    rightData: [],
    leftHeight: 0,
    rightHeight: 0,
    weekdays: ['周日', '', '周五', '', '周三', '', '周一'],
    totalContributions: 0,
    selectedImages: [],
    CustomBar: app.globalData.CustomBar,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.initContributionData();
    this.getImageList()
  },

  //获取图片列表
  getImageList: function() {
    this.setData({
      imageLoading: true
    })
    wx.showLoading({
      title: '加载中...',
    })
    var leftHeight = this.data.leftHeight
    var rightHeight = this.data.rightHeight
    var leftData = this.data.leftData
    var rightData = this.data.rightData
    http.request({
      url: '/api/images',
      data: {
        page: this.data.imagePage,
        date: this.data.selectedDate ? this.data.selectedDate.date : '',
      },
      success: (res) => {
        var data = res.data.data
        data.forEach(item => {
          if (leftHeight <= rightHeight) {
            leftHeight += item.height;
            leftData.push(item)
          } else {
            rightHeight += item.height;
            rightData.push(item);
          }
        });

        this.setData({
          leftData,
          rightData,
          imagePage: res.data.current_page,
          imageHasMoreData: Boolean(res.data.next_page_url)
        })
      },
      complete: (res) => {
        this.setData({
          imageLoading: false
        })
        wx.hideLoading();
      }
    })
  },

  // 点击图片触发的预览方法
  previewImage(e) {
    wx.previewImage({
      current: e.currentTarget.dataset.url, // 当前显示图片的 URL
      urls: [e.currentTarget.dataset.url], // 需要预览的图片 URL 列表
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

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
    this.setData({
      leftHeight: 0,
      rightHeight: 0,
      leftData: [],
      rightData: [],
    })
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.setData({
      leftData: [],
      rightData: [],
      imagePage: 1,
      imageLoading: false,
    }, res => {
      this.getImageList()
      wx.vibrateShort()
      wx.showToast({
        title: '刷新成功',
        complete: wx.stopPullDownRefresh()
      })
    })
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    if (this.data.imageHasMoreData) {
      this.setData({
        imagePage: this.data.imagePage + 1
      })
      this.getImageList();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  /**
   * 初始化贡献热力图
   */
  initContributionData() {
    http.request({
      url: '/api/contribution',
      success: (res) => {
        var data = res.data
        this.setData({
          contributionData: data.contribution_data,
          months: data.month_data,
          totalContributions: data.total,
        });
      },
      complete: (res) => {
        wx.hideLoading();
      }
    })
  },

  showDetail(e) {
    const { detail } = e.currentTarget.dataset;
    // 未来日期隐藏不可点击
    if (detail.hide == 1) {
      return;
    }

    var reset = false
    if (this.data.selectedDate && this.data.selectedDate.date == detail.date) {
      reset = true
    }
    this.setData({
      selectedDate: reset ? null : detail
    }, res => {
      this.onPullDownRefresh()
    });
  },

    // 长按图片事件
    handleLongPress(e) {
      const { url } = e.currentTarget.dataset;
      this.setData({
        modalName: 'bottomModal',
        currentImage: url
      });
    },
  
    // 添加图片到已选列表
    addToSelected() {
      const { currentImage, selectedImages } = this.data;
      // 最多数量限制
      if (selectedImages.length >= 10) {
        wx.showToast({
          title: '最多添加10张图片',
          icon: 'none'
        })
        return
      }
      if (!selectedImages.includes(currentImage)) {
        this.setData({
          selectedImages: [...selectedImages, currentImage],
          modalName: null
        });
      } else {
        wx.showToast({
          title: '已添加，不可重复添加',
          icon: 'none'
        })
      }
    },
    showModal(e) {
      this.setData({
        modalName: e.currentTarget.dataset.target
      })
    },
    hideModal(e) {
      this.setData({
        modalName: null
      })
    },
    delImage() {
      wx.showToast({
        title: '暂不支持删除',
        icon: 'none'
      })
    },

    // 移动选择的图片，调整顺序
    moveSelected(e) {
      const {index, direction} = e.currentTarget.dataset
      // 交换位置
      const selectedImages = this.data.selectedImages;
      const item = selectedImages.splice(index, 1)[0];
      selectedImages.splice(direction == 'down' ? index + 1 : (index <= 0 ? 0 : index - 1), 0, item);
      this.setData({
        selectedImages
      });
    },
    // 从已选图片中删除
    removeFromSelectedList(e) {
      const {index} = e.currentTarget.dataset
      const selectedImages = this.data.selectedImages;
      selectedImages.splice(index, 1)
      this.setData({
        selectedImages
      });
    },
    // 图生视频
    image2video() {
      const images = this.data.selectedImages;
      if (images.length < 2) {
        wx.showToast({
          title: '至少需要2张图片',
          icon: 'error'
        })
        return;
      }

      http.request({
        url: '/api/images2video',
        method: 'POST',
        data: {
          images: images
        },
        success: res => {
          console.log(res)
          wx.showToast({
            title: '已提交',
          })
        }
      })
    }
})