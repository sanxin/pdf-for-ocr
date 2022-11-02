<template>
    <div id="app">
        <div class="system-menu"></div>
        <div class="system-container">
            <div class="page-header"></div>
            <div class="page-container">
                <el-tabs v-model="activeTab">
                    <el-tab-pane label="PDF材料" name="materials">
                        <div class="btn-block">
                            <el-button type="primary" plain @click="ocrClickFn">
                                ocr识别
                            </el-button>
                        </div>
                        <div class="preview-container">
                            <div
                                class="file-block"
                                ref="fileBlock"
                                id="fileBlock"
                            >
                                <iframe
                                    id="fileIframe"
                                    ref="fileIframe"
                                    :src="iframeUrl"
                                    frameborder="0"
                                    :width="iframeWidth + 'px'"
                                    :height="iframeHeight + 'px'"
                                ></iframe>
                            </div>
                            <ocr-temp
                                v-if="ocrClick"
                                @close="ocrEnd"
                            ></ocr-temp>
                        </div>
                    </el-tab-pane>
                </el-tabs>
            </div>
        </div>
    </div>
</template>

<script>
import OcrTemp from "@/views/ocr.vue";
export default {
    name: "App",
    components: {
        OcrTemp
    },
    data() {
        return {
            activeTab: "materials",
            fileName:
                "Trace-based Just-in-Time Type Specialization for Dynamic Languages",
            filePath: "",
            iframeUrl: "",
            ocrClick: false,
            iframeWidth: 0,
            iframeHeight: 0
        };
    },
    mounted() {
        let _base = `/static/PDF/web/viewer.html?name=${encodeURIComponent(
            this.fileName
        )}`;
        this.iframeUrl = this.filePath
            ? _base + `&file=${encodeURIComponent(this.filePath)}`
            : _base;
    },
    methods: {
        ocrClickFn() {
            this.ocrClick = true;
            this.$nextTick(() => {
                this.iframeWidth = this.$refs.fileBlock.offsetWidth;
                this.iframeHeight = this.$refs.fileBlock.offsetHeight;
            });
        },
        ocrEnd() {
            this.ocrClick = false;
            this.iframeWidth = 0;
            this.iframeHeight = 0;
        }
    }
};
</script>

<style>
</style>
