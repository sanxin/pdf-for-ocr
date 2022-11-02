<template>
    <div class="ocr-temp" ref="octTemp">
        <div class="clip-block" ref="clipBlock" v-show="isClip">
            <canvas id="desktop-canvas" ref="desktop"></canvas>
            <canvas
                id="main-canvas"
                ref="mainCanvas"
                :style="{
                    left: x + 'px',
                    top: y + pdfToolBarHeight + 'px'
                }"
            ></canvas>
            <div
                class="region-block"
                ref="regionBlock"
                :style="{
                    left: x + 'px',
                    top: y + pdfToolBarHeight + 'px',
                    width: width + 'px',
                    height: height + 'px',
                    borderWidth: this.borderW + 'px'
                }"
                @mousedown="onMainCanvasMove"
            >
                <div
                    class="handle-block left-up"
                    id="left-up"
                    @mousedown.stop="onLeftUpDrag"
                ></div>
                <div
                    class="handle-block up"
                    id="up"
                    @mousedown.stop="onUpDrag"
                ></div>
                <div
                    class="handle-block right-up"
                    id="right-up"
                    @mousedown.stop="onRightUpDrag"
                ></div>
                <div
                    class="handle-block right"
                    id="right"
                    @mousedown.stop="onRightDrag"
                ></div>
                <div
                    class="handle-block right-down"
                    id="right-down"
                    @mousedown.stop="onRightDownDrag"
                ></div>
                <div
                    class="handle-block down"
                    id="down"
                    @mousedown.stop="onDownDrag"
                ></div>
                <div
                    class="handle-block left-down"
                    id="left-down"
                    @mousedown.stop="onLeftDownDrag"
                ></div>
                <div
                    class="handle-block left"
                    id="left"
                    @mousedown.stop="onLeftDrag"
                ></div>
            </div>
            <div
                class="clip-btns"
                v-show="width"
                :style="{
                    width: width + 'px',
                    left: x + 'px',
                    top: clipBtnsPosTop + 'px'
                }"
            >
                <el-button
                    class="full-btn"
                    type="primary"
                    @click="fullScreenClick"
                >
                    选择全屏
                </el-button>
                <el-button @click="closeOcrClop"> 取消 </el-button>
                <el-button type="primary" @click="startOcr">
                    开始识别
                </el-button>
            </div>
        </div>
        <div class="loading-block" v-if="isLoading">
            <p class="progress-text" v-show="!ocrError">{{ progress }}%</p>
            <div class="progress-block" v-show="!ocrError">
                <el-progress
                    v-if="progress < 101"
                    :show-text="false"
                    :stroke-width="16"
                    color="#357FEA"
                    :percentage="progress"
                ></el-progress>
                <p><i class="el-icon-loading"></i></p>
            </div>
            <p class="progress-info">
                {{
                    ocrError
                        ? "服务器开小差了"
                        : "正在识别数据，请勿关闭或刷新页面"
                }}
            </p>
            <p class="progress-btns" v-show="ocrError">
                <el-button @click="closeOcrClop"> 取消识别 </el-button>
                <el-button type="primary" @click="startOcr">
                    继续识别
                </el-button>
            </p>
        </div>
        <div class="result-block" v-if="isResult">
            <div class="result-box">
                <div class="result-text">{{ resultText }}</div>
                <div class="result-btns">
                    <el-button @click="closeOcrClop"> 取消 </el-button>
                    <el-button type="primary" @click="CopyResultFn">
                        复制文本
                    </el-button>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import html2canvas from "html2canvas";
export default {
    name: "",
    data() {
        return {
            isClip: false, // 截屏显示
            isLoading: false, // 识别中显示
            progress: 0, // 识别进度
            isResult: false, // 识别结果显示
            resultText: "", // 识别结果的内容
            x: 0, //  x 轴坐标
            y: 0, // y 轴坐标
            width: 0, // 宽度
            height: 0, // 的高度
            borderW: 2, // 边宽
            initWSize: 260, // 默认最小宽度
            initHSize: 100, // 默认最小高度
            toolBtnHeight: 32, // 操作按钮模块的高度
            toolBtnMargin: 6, // 操作按钮模块的间距
            pdfMargin: 9, // pdf的css样式所设置的每页margin间距
            pdfToolBarHeight: 32, // pdf的工具栏高度
            desktopRect: {},
            ocrError: false, // ocr识别接口是否返回失败
            timer: null // 识别进度定时器
        };
    },
    computed: {
        clipBtnsPosTop() {
            let _top = 0;
            if (this.isClip) {
                if (
                    this.y +
                        this.height +
                        this.toolBtnHeight +
                        this.toolBtnMargin <
                    this.desktopRect?.height
                ) {
                    _top =
                        this.y +
                        this.pdfToolBarHeight +
                        this.height +
                        this.toolBtnMargin;
                } else {
                    _top = this.y - this.toolBtnMargin;
                }
            }
            return _top;
        }
    },
    mounted() {
        this.showOcrClip();
    },
    methods: {
        // 开始截屏功能
        showOcrClip() {
            this.resetOctAttrFn();
            this.screenCaptureToImage();
            this.isClip = true;
        },
        // 结束ocr的功能显示
        closeOcrClop() {
            this.$emit("close");
            this.resetOctAttrFn();
        },
        // html2canvas把当前文件内容显示区域的图形数据绘制到desktop-canvas中，以供后续截屏功能使用
        screenCaptureToImage() {
            this.$nextTick(() => {
                const iframeHtml =
                    document.getElementById("fileIframe").contentWindow;
                const iframeViewerContainer =
                    iframeHtml.document.getElementById("viewerContainer");
                const iframeViewer =
                    iframeHtml.document.getElementById("viewer");
                const iframeViewerPage =
                    iframeHtml.document.getElementsByClassName("page")[0];

                if (iframeViewerContainer && iframeViewer && iframeViewerPage) {
                    const _vCWidth = iframeViewerContainer.clientWidth;
                    const _vCHeight = iframeViewerContainer.clientHeight;
                    const _vCscrollLeft = iframeViewerContainer.scrollLeft;
                    const _vCscrollTop = iframeViewerContainer.scrollTop;
                    const _vWidth = iframeViewer.clientWidth;
                    const _pWidth = iframeViewerPage.clientWidth;

                    let canvas = this.$refs.desktop;
                    let ctx = canvas.getContext("2d");
                    canvas.style.width = _vCWidth + "px";
                    canvas.style.height = _vCHeight + "px";
                    canvas.style.top = this.pdfToolBarHeight + "px";
                    canvas.style.left = "0px";
                    canvas.width = _vCWidth;
                    canvas.height = _vCHeight;
                    ctx.clearRect(0, 0, _vCWidth, _vCHeight);

                    html2canvas(iframeViewerContainer, {
                        backgroundColor: null,
                        canvas,
                        x:
                            _vWidth - _pWidth > 20
                                ? -(_vWidth - _pWidth) / 2
                                : _vCscrollLeft - this.pdfMargin,
                        y: _vCscrollTop - this.pdfMargin,
                        scrollX: _vCscrollLeft,
                        scrollY: _vCscrollTop,
                        width: _vCWidth,
                        height: _vCHeight,
                        ignoreElements: (element) => {
                            if (element.className == "textLayer") return true;
                        },
                        allowTaint: true,
                        useCORS: true,
                        logging: false
                    }).then((res) => {
                        this.initScreenshotArea();
                    });
                } else {
                    this.$message.warning({
                        showClose: true,
                        message: "文件未加载完毕，请稍后再OCR识别！"
                    });
                    this.closeOcrClop();
                }
            });
        },
        // 初始截屏参数设置，默认截取内容居中显示
        initScreenshotArea() {
            const rect = this.$refs.desktop.getBoundingClientRect();
            this.desktopRect = {
                bottom: rect.bottom,
                height: rect.height,
                left: rect.left,
                right: rect.right,
                top: rect.top,
                width: rect.width,
                x: rect.x,
                y: rect.y
            };
            this.width = this.initWSize;
            this.height = this.initHSize;
            this.x = (rect.width - this.width) / 2;
            this.y = (rect.height - this.height) / 2;
            this.clipDesktop();
        },
        // 截屏的内容渲染
        clipDesktop() {
            let desktop = this.$refs.desktop;
            const ctx = this.setCanvas(
                this.$refs.mainCanvas,
                this.width,
                this.height
            );
            ctx.clearRect(0, 0, this.width, this.height);
            ctx.drawImage(
                desktop,
                this.x,
                this.y,
                this.width,
                this.height,
                0,
                0,
                this.width,
                this.height
            );
        },
        // 移动截屏的位置
        onMainCanvasMove(e) {
            const leftWidth = e.clientX - this.x - this.desktopRect.x;
            const topHeight = e.clientY - this.y - this.desktopRect.y;

            document.onmousemove = (e) => {
                let posX = e.clientX - leftWidth - this.desktopRect.x;
                let posY = e.clientY - topHeight - this.desktopRect.y;
                if (posX < 0) {
                    posX = 0;
                } else if (posX > this.desktopRect.width - this.width) {
                    posX = this.desktopRect.width - this.width;
                }

                if (posY < 0) {
                    posY = 0;
                } else if (posY > this.desktopRect.height - this.height) {
                    posY = this.desktopRect.height - this.height;
                }

                this.x = posX;
                this.y = posY;
                this.clipDesktop();
            };
            document.onmouseup = () => {
                document.onmousemove = null;
                document.onmouseup = null;
            };
        },
        onLeftUpDrag(e) {
            const pos_right = this.x + this.width;
            const pos_bottom = this.y + this.height;
            document.onmousemove = (e) => {
                let posX = 0,
                    posY = 0;
                if (e.clientX < this.desktopRect.x) {
                    posX = 0;
                } else if (
                    pos_right + this.desktopRect.x - e.clientX <
                    this.initWSize
                ) {
                    posX = pos_right - this.initWSize;
                } else {
                    posX = e.clientX - this.desktopRect.x;
                }

                if (e.clientY < this.desktopRect.y) {
                    posY = 0;
                } else if (
                    pos_bottom + this.desktopRect.y - e.clientY <
                    this.initHSize
                ) {
                    posY = pos_bottom - this.initHSize;
                } else {
                    posY = e.clientY - this.desktopRect.y;
                }

                this.x = posX;
                this.y = posY;
                this.width = pos_right - posX;
                this.height = pos_bottom - posY;

                this.clipDesktop();
            };
            document.onmouseup = () => {
                document.onmousemove = null;
                document.onmouseup = null;
            };
        },
        onUpDrag(e) {
            const pos_bottom = this.y + this.height;
            document.onmousemove = (e) => {
                let posY = 0;
                if (e.clientY < this.desktopRect.y) {
                    posY = 0;
                } else if (
                    pos_bottom + this.desktopRect.y - e.clientY <
                    this.initHSize
                ) {
                    posY = pos_bottom - this.initHSize;
                } else {
                    posY = e.clientY - this.desktopRect.y;
                }
                this.y = posY;
                this.height = pos_bottom - posY;

                this.clipDesktop();
            };
            document.onmouseup = () => {
                document.onmousemove = null;
                document.onmouseup = null;
            };
        },
        onRightUpDrag(e) {
            const pos_bottom = this.y + this.height;
            document.onmousemove = (e) => {
                let _w = 0,
                    posY = 0;
                if (e.clientX < this.x + this.desktopRect.x + this.initWSize) {
                    _w = this.initWSize;
                } else if (
                    e.clientX >
                    this.desktopRect.x + this.desktopRect.width
                ) {
                    _w = this.desktopRect.width - this.x;
                } else {
                    _w = e.clientX - this.desktopRect.x - this.x;
                }

                if (e.clientY < this.desktopRect.y) {
                    posY = 0;
                } else if (
                    pos_bottom + this.desktopRect.y - e.clientY <
                    this.initHSize
                ) {
                    posY = pos_bottom - this.initHSize;
                } else {
                    posY = e.clientY - this.desktopRect.y;
                }
                this.y = posY;
                this.width = _w;
                this.height = pos_bottom - posY;

                this.clipDesktop();
            };
            document.onmouseup = () => {
                document.onmousemove = null;
                document.onmouseup = null;
            };
        },
        onRightDrag(e) {
            document.onmousemove = (e) => {
                let _w = 0;
                if (e.clientX < this.x + this.desktopRect.x + this.initWSize) {
                    _w = this.initWSize;
                } else if (
                    e.clientX >
                    this.desktopRect.x + this.desktopRect.width
                ) {
                    _w = this.desktopRect.width - this.x;
                } else {
                    _w = e.clientX - this.desktopRect.x - this.x;
                }

                this.width = _w;
                this.clipDesktop();
            };
            document.onmouseup = () => {
                document.onmousemove = null;
                document.onmouseup = null;
            };
        },
        onRightDownDrag(e) {
            document.onmousemove = (e) => {
                let _w = 0,
                    _h = 0;
                if (e.clientX < this.x + this.desktopRect.x + this.initWSize) {
                    _w = this.initWSize;
                } else if (
                    e.clientX >
                    this.desktopRect.x + this.desktopRect.width
                ) {
                    _w = this.desktopRect.width - this.x;
                } else {
                    _w = e.clientX - this.desktopRect.x - this.x;
                }

                if (e.clientY < this.y + this.desktopRect.y + this.initHSize) {
                    _h = this.initHSize;
                } else if (
                    e.clientY >
                    this.desktopRect.y + this.desktopRect.height
                ) {
                    _h = this.desktopRect.height - this.y;
                } else {
                    _h = e.clientY - this.desktopRect.y - this.y;
                }

                this.width = _w;
                this.height = _h;
                this.clipDesktop();
            };
            document.onmouseup = () => {
                document.onmousemove = null;
                document.onmouseup = null;
            };
        },
        onDownDrag(e) {
            document.onmousemove = (e) => {
                let _h = 0;
                if (e.clientY < this.y + this.desktopRect.y + this.initHSize) {
                    _h = this.initHSize;
                } else if (
                    e.clientY >
                    this.desktopRect.y + this.desktopRect.height
                ) {
                    _h = this.desktopRect.height - this.y;
                } else {
                    _h = e.clientY - this.desktopRect.y - this.y;
                }

                this.height = _h;
                this.clipDesktop();
            };
            document.onmouseup = () => {
                document.onmousemove = null;
                document.onmouseup = null;
            };
        },
        onLeftDownDrag(e) {
            const pos_right = this.x + this.width;
            document.onmousemove = (e) => {
                let posX = 0,
                    _h = 0;
                if (e.clientX < this.desktopRect.x) {
                    posX = 0;
                } else if (
                    pos_right + this.desktopRect.x - e.clientX <
                    this.initWSize
                ) {
                    posX = pos_right - this.initWSize;
                } else {
                    posX = e.clientX - this.desktopRect.x;
                }

                if (e.clientY < this.y + this.desktopRect.y + this.initHSize) {
                    _h = this.initHSize;
                } else if (
                    e.clientY >
                    this.desktopRect.y + this.desktopRect.height
                ) {
                    _h = this.desktopRect.height - this.y;
                } else {
                    _h = e.clientY - this.desktopRect.y - this.y;
                }

                this.x = posX;
                this.width = pos_right - posX;
                this.height = _h;

                this.clipDesktop();
            };
            document.onmouseup = () => {
                document.onmousemove = null;
                document.onmouseup = null;
            };
        },
        onLeftDrag(e) {
            const pos_right = this.x + this.width;
            document.onmousemove = (e) => {
                let posX = 0;
                if (e.clientX < this.desktopRect.x) {
                    posX = 0;
                } else if (
                    pos_right + this.desktopRect.x - e.clientX <
                    this.initWSize
                ) {
                    posX = pos_right - this.initWSize;
                } else {
                    posX = e.clientX - this.desktopRect.x;
                }
                this.x = posX;
                this.width = pos_right - posX;

                this.clipDesktop();
            };
            document.onmouseup = () => {
                document.onmousemove = null;
                document.onmouseup = null;
            };
        },
        setCanvas(canvas, width, height) {
            let ctx = canvas.getContext("2d");
            canvas.style.width = width + "px";
            canvas.style.height = height + "px";
            let backingStorePixelRatio =
                ctx.webkitBackingStorePixelRatio ||
                ctx.mozBackingStorePixelRatio ||
                ctx.msBackingStorePixelRatio ||
                ctx.oBackingStorePixelRatio ||
                ctx.backingStorePixelRatio ||
                1;

            const pixelRatio =
                (window.devicePixelRatio || 1) / backingStorePixelRatio;
            canvas.width = width * pixelRatio;
            canvas.height = height * pixelRatio;
            ctx.scale(pixelRatio, pixelRatio);

            return ctx;
        },
        // 全屏截屏
        fullScreenClick() {
            this.width = this.desktopRect.width;
            this.height = this.desktopRect.height;
            this.x = 0;
            this.y = 0;
            this.clipDesktop();
        },
        // 重置ocr识别操作的所有参数
        resetOctAttrFn() {
            this.isClip = false;
            this.isLoading = false;
            this.progress = 0;
            this.isResult = false;
            this.resultText = "";
            this.x = 0;
            this.y = 0;
            this.width = 0;
            this.height = 0;
            this.desktopRect = {};
            this.ocrError = false;
            this.timer = null;
        },
        // 开始识别
        startOcr() {
            this.resetOctAttrFn();
            let _imgData = this.$refs.mainCanvas.toDataURL("image/png", 1.0);
            // _imgData为需要识别的图片数据
            console.log(_imgData);
            this.isLoading = true;
            this.progress = 0;
            let self = this;
            this.timer = setInterval(() => {
                if (self.progress == 90) {
                    self.clearTimer();
                    self.ocrError = true;
                } else {
                    self.progress++;
                }
            }, 50);

            // ajax().then(res => {
            //     this.clearTimer();
            //     this.progress = 90;
            //     this.timer = setInterval(() => {
            //         if (self.progress == 100) {
            //             self.clearTimer();
            //             self.isResult = true;
            //             self.resultText =  `mov edx, ebx(748) // load primes from the trace activation record\nmov edi(0), edx // (*) store primes to interpreter stack\nmov esi, ebx(764) // load k from the trace activation record\nmov edi(8), esi // (*) store k to interpreter stack\nmov edi(16), 0 // (*) store false to interpreter stack\nmov eax, edx(4) // (*) load object class word for primes\nand eax, -4 // (*) mask out object class tag for primes\ncmp eax, Array // (*) test whether primes is an array\njne side_exit_1 // (*) side exit if primes is not an array\nsub esp, 8 // bump stack for call alignment convention\npush false // push last argument for call\npush esi // push first argument for call\ncall js_Array_set // call function to set array element\nadd esp, 8 // clean up extra stack space\nmov ecx, ebx // (*) created by register allocator\ntest eax, eax // (*) test return value of js_Array_set\nje side_exit_2 // (*) side exit if call failed`;
            //             self.isLoading = false;
            //             self.progress = 0;
            //         } else {
            //             self.progress++;
            //         }
            //     }, 30);
            // }).catch(() => {
            //     this.ocrError = true;
            //     this.clearTimer();
            // })
        },
        // 清除定时器
        clearTimer() {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
        },
        // 复制识别结果的文本
        CopyResultFn() {
            this.$copyText(this.resultText).then(
                (res) => {
                    this.$message({
                        showClose: true,
                        duration: 2000,
                        message: "复制成功",
                        type: "success"
                    });
                    this.closeOcrClop();
                },
                (err) => {
                    this.$message({
                        showClose: true,
                        duration: 2000,
                        message: "复制失败",
                        type: "error"
                    });
                }
            );
        }
    }
};
</script>
<style lang="less" scoped>
.ocr-temp {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    bottom: 0;
    .clip-block,
    .loading-block,
    .result-block {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
    }
    #desktop-canvas {
        position: absolute;
        z-index: -1;
        pointer-events: none;
        visibility: hidden;
    }
    #main-canvas {
        position: absolute;
        z-index: 999;
    }
    .region-block {
        position: absolute;
        left: 0;
        top: 0;
        width: 0;
        height: 0;
        z-index: 1000;
        border-style: solid;
        border-color: #1b6bde;
        background: transparent;
        cursor: move;
        .handle-block {
            position: absolute;
            width: 10px;
            height: 10px;
            background-color: #1b6bde;
            z-index: 1001;
        }
        .left-up {
            left: -5px;
            top: -5px;
            cursor: nw-resize;
        }
        .up {
            left: 50%;
            margin-left: -5px;
            top: -5px;
            cursor: n-resize;
        }
        .right-up {
            right: -5px;
            top: -5px;
            cursor: ne-resize;
        }
        .right {
            top: 50%;
            right: -5px;
            margin-top: -5px;
            cursor: e-resize;
        }
        .right-down {
            right: -5px;
            bottom: -5px;
            cursor: se-resize;
        }
        .down {
            left: 50%;
            margin-left: -5px;
            bottom: -5px;
            cursor: s-resize;
        }
        .left-down {
            left: -5px;
            bottom: -5px;
            cursor: sw-resize;
        }
        .left {
            top: 50%;
            left: -5px;
            margin-top: -5px;
            cursor: w-resize;
        }
    }
    .clip-btns {
        position: absolute;
        z-index: 1000;
        text-align: right;
        .full-btn {
            float: left;
        }
    }
    .loading-block {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #fff;
    }
    .progress-text {
        font-size: 20px;
        font-weight: bold;
    }

    .progress-block {
        margin: 20px 0;
        width: 60%;
        display: flex;
        align-items: center;
        > p {
            flex: none;
            width: 20px;
        }
    }
    /deep/.el-icon-loading {
        font-size: 18px;
    }
    /deep/.el-progress {
        margin-right: 10px;
        flex: 1;
        min-width: 1px;
    }
    .progress-info {
        margin-bottom: 20px;
    }
    .result-block {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .result-box {
        width: 70%;
        height: 70%;
    }
    .result-text {
        padding: 10px;
        width: 100%;
        height: calc(100% - 42px);
        line-height: 22px;
        background: #fff;
        border: 2px solid #1b6bde;
        color: #364a63;
        font-size: 14px;
        white-space: pre-wrap;
        word-wrap: break-word;
        overflow-x: hidden;
        overflow-y: auto;
    }
    .result-btns {
        margin-top: 10px;
        height: 32px;
        text-align: right;
    }
}
</style>