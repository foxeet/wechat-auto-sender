// renderer.js
const { ipcRenderer } = require('electron');

console.log("📝 renderer.js 已经开始执行");

const STORAGE_KEY = "wechat_auto_send_items";

// 从 localStorage 读取
function loadItems() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("读取存储出错：", e);
    return [];
  }
}

// 保存到 localStorage
function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

window.addEventListener('DOMContentLoaded', () => {
  console.log("🕒 DOMContentLoaded：页面 DOM 已经完全加载");

  const addButton = document.getElementById("add-button");
  const itemList = document.getElementById("item-list");
  const startButton = document.getElementById("start-button");
  const statusBox = document.getElementById("status-box");
  const statusText = document.getElementById("status-text");

  // 弹窗元素
  const choiceDialog = document.getElementById("choice-dialog");
  const choiceTextBtn = document.getElementById("choice-text");
  const choiceImageBtn = document.getElementById("choice-image");
  const choiceCancelBtn = document.getElementById("choice-cancel");

  const textDialog = document.getElementById("text-dialog");
  const textInput = document.getElementById("text-input");
  const textConfirmBtn = document.getElementById("text-confirm");
  const textCancelBtn = document.getElementById("text-cancel");

  const confirmDialog = document.getElementById("confirm-dialog");
  const confirmMessage = document.getElementById("confirm-message");
  const confirmOkBtn = document.getElementById("confirm-ok");
  const confirmNoBtn = document.getElementById("confirm-no");

  let items = loadItems(); // 当前所有内容

  // 渲染列表
  function renderList() {
    console.log("   🔄 renderList 被调用，当前 items:", items);
    itemList.innerHTML = "";

    items.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "item";

      // 内容预览
      const preview = document.createElement("div");
      preview.className = "content-preview";

      if (item.type === "text") {
        const span = document.createElement("div");
        span.className = "text-preview";
        span.textContent = item.value.length > 50
          ? item.value.slice(0, 50) + "…"
          : item.value;
        preview.appendChild(span);
      } else if (item.type === "image") {
        const img = document.createElement("img");
        img.src = item.value; // DataURL
        preview.appendChild(img);
        const label = document.createElement("span");
        label.textContent = "图片";
        preview.appendChild(label);
      }

      // 操作按钮
      const actions = document.createElement("div");
      actions.className = "actions";

      // 编辑按钮（文字项可编辑）
      if (item.type === "text") {
        const editBtn = document.createElement("button");
        editBtn.className = "edit-btn";
        editBtn.textContent = "编辑";
        editBtn.addEventListener("click", () => {
          console.log(`   ✏️ 编辑第 ${index} 条文字`);
          textInput.value = item.value;
          textDialog.showModal();

          textConfirmBtn.onclick = () => {
            const newText = textInput.value.trim();
            if (newText.length === 0) {
              alert("文字不能为空。");
              return;
            }
            item.value = newText;
            saveItems(items);
            renderList();
            textDialog.close();
          };

          textCancelBtn.onclick = () => {
            textDialog.close();
          };
        });
        actions.appendChild(editBtn);
      }

      // 删除按钮
      const delBtn = document.createElement("button");
      delBtn.className = "delete-btn";
      delBtn.textContent = "删除";
      delBtn.addEventListener("click", () => {
        console.log(`   🗑️ 点击删除第 ${index} 条`);
        confirmMessage.textContent = "确认要删除这条内容吗？";
        confirmDialog.showModal();

        confirmOkBtn.onclick = () => {
          items.splice(index, 1);
          saveItems(items);
          renderList();
          confirmDialog.close();
        };
        confirmNoBtn.onclick = () => {
          confirmDialog.close();
        };
      });
      actions.appendChild(delBtn);

      li.appendChild(preview);
      li.appendChild(actions);
      itemList.appendChild(li);
    });

    if (items.length === 0) {
      const emptyLi = document.createElement("li");
      emptyLi.textContent = "当前还没有添加任何内容，点击“＋ 添加内容”开始。";
      emptyLi.style.color = "#888";
      emptyLi.style.padding = "10px";
      itemList.appendChild(emptyLi);
    }
  }

  // 添加文字的实际函数
  function addTextItem() {
    console.log("   ➕ addTextItem 被调用");
    textInput.value = "";
    textDialog.showModal();

    textConfirmBtn.onclick = () => {
      const text = textInput.value.trim();
      if (text.length === 0) {
        alert("文字不能为空。");
        return;
      }
      items.push({
        id: Date.now(),
        type: "text",
        value: text,
        created: Date.now(),
      });
      saveItems(items);
      renderList();
      textDialog.close();
    };

    textCancelBtn.onclick = () => {
      textDialog.close();
    };
  }

  // 添加图片的实际函数
  function addImageItem() {
    console.log("   ➕ addImageItem 被调用");
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) {
        document.body.removeChild(fileInput);
        return;
      }
      const reader = new FileReader();
      reader.onload = function(evt) {
        const dataUrl = evt.target.result;
        items.push({
          id: Date.now(),
          type: "image",
          value: dataUrl,
          created: Date.now(),
        });
        saveItems(items);
        renderList();
        document.body.removeChild(fileInput);
      };
      reader.readAsDataURL(file);
    });
    fileInput.click();
  }

  // “添加内容”按钮点击
  addButton.addEventListener("click", () => {
    console.log("7️⃣ 点击了 “＋ 添加内容”");
    choiceDialog.showModal();

    choiceTextBtn.onclick = () => {
      choiceDialog.close();
      addTextItem();
    };
    choiceImageBtn.onclick = () => {
      choiceDialog.close();
      addImageItem();
    };
    choiceCancelBtn.onclick = () => {
      choiceDialog.close();
    };
  });

  // “开始执行”按钮点击
  startButton.addEventListener("click", async () => {
    console.log("8️⃣ 点击了 “开始执行”");
    if (items.length === 0) {
      alert("请先添加至少一条内容，再点击开始执行。");
      return;
    }

    startButton.disabled = true;
    statusBox.style.display = "block";

    // 倒计时 3-2-1
    for (let sec = 3; sec > 0; sec--) {
      statusText.textContent = `将在 ${sec} 秒后开始发送，请切换到微信输入框…`;
      await new Promise(r => setTimeout(r, 1000));
    }

    // 开始自动发送
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`   🔄 正在发送第 ${i + 1} 条`);
      statusText.textContent = `正在发送第 ${i + 1} 条（共 ${items.length} 条），请勿切换窗口…`;

      try {
        const result = await ipcRenderer.invoke('send-item', item);
        console.log("   📤 send-item 返回：", result);
        if (!result.success) {
          statusText.textContent = `第 ${i + 1} 条发送失败：${result.error}`;
          break;
        }
      } catch (err) {
        console.error("   ❌ send-item 调用抛错：", err);
        statusText.textContent = `第 ${i + 1} 条发送出错：${err.message}`;
        break;
      }

      // 每条发送完毕后，等待 800ms 再执行下一条
      await new Promise(r => setTimeout(r, 800));
    }

    statusText.textContent = "所有内容都已发送完毕。若需重新执行，请点击“开始执行”。";
    startButton.disabled = false;
  });

  // 首次加载渲染列表
  renderList();
});
