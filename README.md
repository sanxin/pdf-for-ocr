## 项目说明
当前项目为Vue2 + PDF.js + html2canvas 实现pdf文件的预览功能，并截取文件的内容进行 ocr 识别。
* 因真实项目的需求，**_修改_** 了部分PDF.js的源码。主要为： 
    > 1. 调整了工具栏的样式布局，~~隐藏~~ 了部分操作功能；增加了 __文件名__ 的显示  
    > 2. 取文件的动态地址进行预览  

 
* PDF源文件中准备了2个pdf文件  
    > test.pdf为多页，tsbl.pdf为单页

## 功能截图展示
### 1. pdf文件预览
![image](https://github.com/sanxin/pdf-for-ocr/blob/main/src/assets/image/1.png)  

### 2. 点击 ocr识别按钮之后（展示默认尺寸的截屏效果）
![image](https://github.com/sanxin/pdf-for-ocr/blob/main/src/assets/image/2.png)  

### 3. 开始ocr识别
![image](https://github.com/sanxin/pdf-for-ocr/blob/main/src/assets/image/3.png)  
### 3.1 ocr识别失败
![image](https://github.com/sanxin/pdf-for-ocr/blob/main/src/assets/image/3-2.png)  
### 4. 识别结果展示，可复制文本内容
![image](https://github.com/sanxin/pdf-for-ocr/blob/main/src/assets/image/4.png)

## 项目结构
```
my-app
├── README.md
├── vue.config.js
├── package.json
├── public
│   ├── favicon.ico
│   ├── static
│   │    └── PDF                                # PDF源文件
│   └── index.html
└── src
    ├── assets
    │    ├── image                              # 图片资源
    │    └── styles                             # css资源
    │         ├── layout                        # 布局类样式
    │         ├── reset                         # 全局重置样式
    │         └── style                         # 全局css出口文件
    ├── views                                   # 页面
    │    └── ocr.vue                            # OCR功能界面
    ├── App.vue
    └── main.js
```


