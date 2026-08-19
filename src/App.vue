<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import QRCode from "qrcode";

const kind = ref("url");
const content = ref("https://qrcode-studio.app");
const link = ref("");
const file = ref(null);
const size = ref(760);
const foreground = ref("#18213a");
const background = ref("#ffffff");
const margin = ref(2);
const rounded = ref(true);
const cornerRadius = ref(7);
const logo = ref(null);
const customTitle = ref("");
const description = ref("扫一扫，即刻抵达");
const errorLevel = ref("M");
const eyeStyle = ref("square");
const canvas = ref(null);
const copied = ref(false);
const errorLevels = [
  { id: "L", label: "L", hint: "约 7%" },
  { id: "M", label: "M", hint: "约 15%" },
  { id: "Q", label: "Q", hint: "约 25%" },
  { id: "H", label: "H", hint: "约 30%" },
];
const eyeStyles = [
  { id: "square", label: "方形" },
  { id: "rounded", label: "圆角" },
  { id: "circle", label: "圆形" },
];
const currentError = computed(
  () =>
    errorLevels.find((item) => item.id === errorLevel.value) || errorLevels[1],
);
const types = [
  { id: "url", icon: "↗", name: "URL 链接", hint: "输入任意网页链接" },
  { id: "image", icon: "▧", name: "图片", hint: "上传图片或粘贴图片链接" },
  { id: "document", icon: "▤", name: "文档", hint: "上传文档或填写分享链接" },
  { id: "video", icon: "▷", name: "视频", hint: "填写视频播放链接" },
];
const active = computed(() => types.find((t) => t.id === kind.value));
const payload = computed(
  () =>
    link.value.trim() ||
    content.value.trim() ||
    (file.value ? `文件：${file.value.name}` : ""),
);
const isUrl = computed(() => ["url", "video"].includes(kind.value));

function chooseKind(id) {
  kind.value = id;
  file.value = null;
  link.value = "";
  content.value = id === "url" ? "https://qrcode-studio.app" : "";
}
function handleFile(e) {
  file.value = e.target.files?.[0] || null;
  if (file.value) content.value = file.value.name;
}
function logoFile(e) {
  const f = e.target.files?.[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => (logo.value = reader.result);
  reader.readAsDataURL(f);
}
function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}
function getCornerRadius(width) {
  return Math.round(width * (cornerRadius.value / 100));
}

function drawFinder(ctx, x, y, unit) {
  const outer = unit * 7;
  const center = x + unit * 3.5;
  if (eyeStyle.value === "circle") {
    ctx.fillStyle = background.value;
    ctx.fillRect(x, y, outer, outer);
    ctx.fillStyle = foreground.value;
    ctx.beginPath();
    ctx.arc(center, center, unit * 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = background.value;
    ctx.beginPath();
    ctx.arc(center, center, unit * 2.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = foreground.value;
    ctx.beginPath();
    ctx.arc(center, center, unit * 1.45, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.fillStyle = foreground.value;
  roundedRect(
    ctx,
    x,
    y,
    outer,
    outer,
    eyeStyle.value === "rounded" ? unit * 1.15 : 0,
  );
  ctx.fill();
  ctx.fillStyle = background.value;
  roundedRect(
    ctx,
    x + unit,
    y + unit,
    unit * 5,
    unit * 5,
    eyeStyle.value === "rounded" ? unit * 0.75 : 0,
  );
  ctx.fill();
  ctx.fillStyle = foreground.value;
  roundedRect(
    ctx,
    x + unit * 2,
    y + unit * 2,
    unit * 3,
    unit * 3,
    eyeStyle.value === "rounded" ? unit * 0.5 : 0,
  );
  ctx.fill();
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = source;
  });
}

async function draw() {
  if (!canvas.value || !payload.value) return;
  const temp = document.createElement("canvas");
  const qr = QRCode.create(payload.value, {
    errorCorrectionLevel: errorLevel.value,
  });
  await QRCode.toCanvas(temp, payload.value, {
    width: size.value,
    margin: margin.value,
    errorCorrectionLevel: errorLevel.value,
    color: { dark: foreground.value, light: background.value },
  });
  const ctx = canvas.value.getContext("2d");
  canvas.value.width = canvas.value.height = size.value;
  ctx.clearRect(0, 0, size.value, size.value);
  ctx.fillStyle = background.value;
  ctx.fillRect(0, 0, size.value, size.value);
  if (rounded.value) {
    ctx.save();
    roundedRect(
      ctx,
      0,
      0,
      size.value,
      size.value,
      getCornerRadius(size.value),
    );
    ctx.clip();
  }
  ctx.drawImage(temp, 0, 0);
  if (rounded.value) ctx.restore();
  const unit = size.value / (qr.modules.size + margin.value * 2);
  const origin = margin.value * unit;
  drawFinder(ctx, origin, origin, unit);
  drawFinder(ctx, origin + (qr.modules.size - 7) * unit, origin, unit);
  drawFinder(ctx, origin, origin + (qr.modules.size - 7) * unit, unit);
  if (logo.value) {
    try {
      const img = await loadImage(logo.value);
      const s = size.value * 0.19,
        x = (size.value - s) / 2;
      ctx.fillStyle = background.value;
      roundedRect(ctx, x - 14, x - 14, s + 28, s + 28, 22);
      ctx.fill();
      ctx.save();
      roundedRect(ctx, x, x, s, s, 12);
      ctx.clip();
      ctx.drawImage(img, x, x, s, s);
      ctx.restore();
    } catch {}
  }
}
async function exportCanvas() {
  await draw();
  const title = customTitle.value.trim(),
    desc = description.value.trim();
  const titleHeight = title ? Math.round(size.value * 0.12) : 0,
    descHeight = desc ? Math.round(size.value * 0.1) : 0;
  const output = document.createElement("canvas");
  output.width = size.value;
  output.height = size.value + titleHeight + descHeight;
  const ctx = output.getContext("2d");
  ctx.clearRect(0, 0, output.width, output.height);
  if (rounded.value) {
    ctx.save();
    roundedRect(ctx, 0, 0, output.width, output.height, getCornerRadius(size.value));
    ctx.clip();
  }
  ctx.fillStyle = background.value;
  ctx.fillRect(0, 0, output.width, output.height);
  ctx.fillStyle = foreground.value;
  ctx.textAlign = "center";
  if (title) {
    ctx.font = `700 ${Math.max(20, Math.round(size.value * 0.055))}px Manrope, Arial, sans-serif`;
    ctx.fillText(title, size.value / 2, titleHeight * 0.68, size.value * 0.86);
  }
  ctx.drawImage(canvas.value, 0, titleHeight);
  if (desc) {
    ctx.font = `500 ${Math.max(16, Math.round(size.value * 0.035))}px Manrope, Arial, sans-serif`;
    ctx.fillText(
      desc,
      size.value / 2,
      titleHeight + size.value + descHeight * 0.65,
      size.value * 0.86,
    );
  }
  if (rounded.value) ctx.restore();
  return output;
}
async function download() {
  try {
    const output = await exportCanvas();
    const blob = await new Promise((resolve, reject) =>
      output.toBlob((value) => (value ? resolve(value) : reject(new Error("PNG export failed"))), "image/png"),
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "my-qrcode.png";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    console.error("二维码下载失败", error);
  }
}
async function copy() {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(payload.value);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = payload.value;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
    }
    copied.value = true;
    setTimeout(() => (copied.value = false), 1600);
  } catch (error) {
    console.error("复制失败", error);
  }
}
watch(
  [
    kind,
    content,
    link,
    size,
    foreground,
    background,
    margin,
    rounded,
    cornerRadius,
    logo,
    errorLevel,
    eyeStyle,
  ],
  () => nextTick(draw),
  { deep: true },
);
onMounted(draw);
</script>

<template>
  <main>
    <nav>
      <div class="brand"><i>⌁</i><span>QR Studio</span></div>
      <div class="nav-links">
        <a class="selected">创作中心</a><a>我的二维码</a><a>使用指南</a>
      </div>
      <button class="avatar">W</button>
    </nav>
    <section class="hero">
      <div class="eyebrow">DESIGN YOUR CONNECTION</div>
      <h1>把每一次分享，<em>变得更有型。</em></h1>
      <p>生成精致且可自定义的二维码，让内容传递拥有独特的视觉语言。</p>
    </section>
    <section class="studio">
      <aside class="panel setup">
        <div class="section-title">
          <span>01</span>
          <div><b>选择内容类型</b><small>想分享什么？</small></div>
        </div>
        <div class="type-grid">
          <button
            v-for="t in types"
            :key="t.id"
            :class="{ active: kind === t.id }"
            @click="chooseKind(t.id)"
          >
            <strong>{{ t.icon }}</strong
            ><span>{{ t.name }}</span>
          </button>
        </div>
        <div class="section-title second">
          <span>02</span>
          <div>
            <b>{{ active.name }}</b
            ><small>{{ active.hint }}</small>
          </div>
        </div>
        <label v-if="isUrl" class="input-label"
          >链接地址<input v-model="content" placeholder="https://"
        /></label>
        <template v-else
          ><label class="drop"
            ><input
              type="file"
              :accept="
                kind === 'image'
                  ? 'image/*'
                  : kind === 'video'
                    ? 'video/*'
                    : '.pdf,.doc,.docx,.xls,.xlsx'
              "
              @change="handleFile"
            /><b>＋ 上传{{ active.name }}</b
            ><small>{{ file?.name || "或拖放文件到这里" }}</small></label
          ><label class="input-label"
            >分享链接 <small>（推荐，扫码后可直接访问）</small
            ><input v-model="link" placeholder="https://" /></label
        ></template>
      </aside>
      <section class="preview">
        <div class="qr-card">
          <h2 v-if="customTitle.trim()" class="qr-title">{{ customTitle }}</h2>
          <canvas ref="canvas"></canvas>
          <p v-if="description.trim()" class="qr-description">
            {{ description }}
          </p>
        </div>
        <div class="actions">
          <button class="secondary" @click="copy">
            {{ copied ? "已复制！" : "复制二维码" }}</button
          ><button class="primary" @click="download">
            下载 PNG <span>↓</span>
          </button>
        </div>
        <p class="privacy">安全生成 · 内容仅在本地浏览器处理</p>
      </section>
      <aside class="panel customize">
        <div class="section-title">
          <span>03</span>
          <div><b>定制你的风格</b><small>让二维码独一无二</small></div>
        </div>
        <div class="control">
          <label>主色调</label>
          <div class="swatches">
            <button
              v-for="c in [
                '#18213a',
                '#3e49e8',
                '#f05d56',
                '#0d8c7a',
                '#d8a74b',
              ]"
              :key="c"
              :class="{ picked: foreground === c }"
              :style="{ background: c }"
              @click="foreground = c"
            ></button
            ><input v-model="foreground" type="color" />
          </div>
        </div>
        <div class="control">
          <label>背景色</label>
          <div class="color-line">
            <input v-model="background" type="color" /><code>{{
              background
            }}</code>
          </div>
        </div>
        <div class="control">
          <label
            >二维码尺寸 <b>{{ Math.round(size / 10) }}0 px</b></label
          ><input v-model="size" type="range" min="300" max="1200" step="50" />
        </div>
        <div class="control">
          <label
            >留白边距 <b>{{ margin }}</b></label
          ><input v-model="margin" type="range" min="0" max="8" />
        </div>
        <div class="switch-line">
          <span><b>圆角卡片</b><small>柔和的展示边缘</small></span
          ><button
            class="switch"
            :class="{ on: rounded }"
            @click="rounded = !rounded"
          >
            <i></i>
          </button>
        </div>
        <label class="logo-add"
          ><input type="file" accept="image/*" @change="logoFile" />{{
            logo ? "✓ 已添加中心 Logo" : "+ 添加中心 Logo"
          }}</label
        >
      </aside>
    </section>
  </main>
  <aside class="feature-controls">
    <div class="control">
      <label
        >容错率 <b>{{ currentError.hint }}</b></label
      >
      <div class="segmented">
        <button
          v-for="item in errorLevels"
          :key="item.id"
          :class="{ active: errorLevel === item.id }"
          @click="errorLevel = item.id"
        >
          {{ item.label }}
        </button>
      </div>
    </div>
    <div class="control">
      <label>码眼样式</label>
      <div class="eye-options">
        <button
          v-for="item in eyeStyles"
          :key="item.id"
          class="eye-option"
          :class="{ active: eyeStyle === item.id }"
          @click="eyeStyle = item.id"
        >
          <i class="eye-icon" :class="item.id"></i><span>{{ item.label }}</span>
        </button>
      </div>
    </div>
    <div class="control">
      <label>圆角大小 <b>{{ cornerRadius }}%</b></label>
      <input v-model="cornerRadius" type="range" min="0" max="20" step="1" />
    </div>
    <div class="control text-controls">
      <label
        >自定义标题<input
          v-model="customTitle"
          maxlength="30"
          placeholder="例如：我的主页" /></label
      ><label
        >底部文字描述<input
          v-model="description"
          maxlength="45"
          placeholder="例如：扫一扫，即刻抵达"
      /></label>
    </div>
  </aside>
</template>
