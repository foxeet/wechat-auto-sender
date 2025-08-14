// renderer.js
const { ipcRenderer } = require('electron');

console.log("📝 renderer.js 已经开始执行");

// 存储键
const TASKS_STORAGE_KEY = "wechat_auto_send_tasks";
const CURRENT_TASK_KEY = "wechat_auto_send_current_task";

// 全局变量
let tasks = []; // 任务列表
let currentTaskIndex = 0; // 当前选中的任务索引
let currentTask = null; // 当前任务对象

// 从 localStorage 读取任务列表
function loadTasks() {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) {
        // 如果没有任务，创建一个默认任务
        const defaultTask = {
            id: Date.now(),
            name: "默认任务",
            description: "这是一个默认任务",
            created: Date.now(),
            items: []
        };
        return [defaultTask];
    }
    try {
        return JSON.parse(raw);
    } catch (e) {
        console.error("读取任务存储出错：", e);
        return [{
            id: Date.now(),
            name: "默认任务",
            description: "这是一个默认任务",
            created: Date.now(),
            items: []
        }];
    }
}

// 保存任务列表到 localStorage
function saveTasks() {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

// 从 localStorage 读取当前任务索引
function loadCurrentTaskIndex() {
    const raw = localStorage.getItem(CURRENT_TASK_KEY);
    if (!raw) return 0;
    try {
        const index = parseInt(raw);
        return index >= 0 && index < tasks.length ? index : 0;
    } catch (e) {
        console.error("读取当前任务索引出错：", e);
        return 0;
    }
}

// 保存当前任务索引到 localStorage
function saveCurrentTaskIndex() {
    localStorage.setItem(CURRENT_TASK_KEY, currentTaskIndex.toString());
}

// 添加日志（支持两个日志区域）
function addLog(message, type = 'info') {
    const logContent = document.getElementById('log-content');
    const logContentDetail = document.getElementById('log-content-detail');
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    logEntry.textContent = `[${timestamp}] ${message}`;
    
    // 同时更新两个日志区域
    if (logContent) {
        logContent.appendChild(logEntry.cloneNode(true));
        logContent.scrollTop = logContent.scrollHeight;
    }
    
    if (logContentDetail) {
        logContentDetail.appendChild(logEntry.cloneNode(true));
        logContentDetail.scrollTop = logContentDetail.scrollHeight;
    }
    
    // 在执行任务时，同时以Toast形式显示重要日志
    if (type === 'success' || type === 'error' || type === 'warning') {
        showToast(message, 4000);
    }
    
    console.log(`📝 [${type.toUpperCase()}] ${message}`);
}

// 显示弹窗
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

// 隐藏弹窗
function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// 显示 Toast 提示
function showToast(message, duration = 3000) {
    const toastContainer = document.getElementById('toast-container');
    const toastMessage = document.getElementById('toast-message');
    
    if (toastContainer && toastMessage) {
        toastMessage.textContent = message;
        toastContainer.style.display = 'block';
        toastContainer.classList.add('show');
        
        // 自动隐藏
        setTimeout(() => {
            toastContainer.classList.add('hide');
            setTimeout(() => {
                toastContainer.style.display = 'none';
                toastContainer.classList.remove('show', 'hide');
            }, 300);
        }, duration);
    }
}

// 显示输入对话框（替代 prompt）
function showInputDialog(message, callback) {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        width: 90%;
        max-width: 400px;
    `;
    
    const title = document.createElement('div');
    title.style.cssText = `
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 15px;
        color: #333;
    `;
    title.textContent = message;
    
    const input = document.createElement('input');
    input.style.cssText = `
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        margin-bottom: 15px;
        box-sizing: border-box;
    `;
    input.placeholder = '请输入内容';
    input.focus();
    
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 10px;
        justify-content: flex-end;
    `;
    
    const confirmBtn = document.createElement('button');
    confirmBtn.style.cssText = `
        padding: 8px 16px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    `;
    confirmBtn.textContent = '确定';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.style.cssText = `
        padding: 8px 16px;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    `;
    cancelBtn.textContent = '取消';
    
    const handleConfirm = () => {
        const value = input.value.trim();
        if (value) {
            callback(value);
        }
        document.body.removeChild(dialog);
    };
    
    const handleCancel = () => {
        callback(null);
        document.body.removeChild(dialog);
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleConfirm();
        }
    });
    
    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(confirmBtn);
    
    content.appendChild(title);
    content.appendChild(input);
    content.appendChild(buttonContainer);
    dialog.appendChild(content);
    document.body.appendChild(dialog);
}

// 显示图片文件选择对话框
function showImageFileDialog(callback) {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        width: 90%;
        max-width: 500px;
    `;
    
    const title = document.createElement('div');
    title.style.cssText = `
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 15px;
        color: #333;
    `;
        title.textContent = '选择图片文件';

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.cssText = `
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        margin-bottom: 15px;
        box-sizing: border-box;
    `;
    
    const previewContainer = document.createElement('div');
    previewContainer.style.cssText = `
        text-align: center;
        min-height: 100px;
        border: 2px dashed #ddd;
        border-radius: 4px;
        padding: 20px;
        margin-bottom: 15px;
        color: #999;
    `;
    previewContainer.textContent = '请选择图片文件';

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 10px;
        justify-content: flex-end;
    `;

    const confirmBtn = document.createElement('button');
    confirmBtn.style.cssText = `
        padding: 8px 16px;
        background: #000000;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    `;
    confirmBtn.textContent = '确定';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.style.cssText = `
        padding: 8px 16px;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    `;
    cancelBtn.textContent = '取消';
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            // 检查文件大小（2MB = 2 * 1024 * 1024 bytes）
            const maxSize = 2 * 1024 * 1024; // 2MB
            if (file.size > maxSize) {
                const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                alert(`图片文件过大！当前大小：${sizeMB}MB，最大允许：2MB。请选择较小的图片文件。`);
                fileInput.value = ''; // 清空文件选择
                previewContainer.textContent = '请选择图片文件';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                previewContainer.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 200px; object-fit: contain;">`;
            };
            reader.readAsDataURL(file);
        } else {
            alert('请选择有效的图片文件！');
        }
    });
    
    const handleConfirm = () => {
        const file = fileInput.files[0];
        if (file && file.type.startsWith('image/')) {
            // 再次检查文件大小（2MB = 2 * 1024 * 1024 bytes）
            const maxSize = 2 * 1024 * 1024; // 2MB
            if (file.size > maxSize) {
                const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                alert(`图片文件过大！当前大小：${sizeMB}MB，最大允许：2MB。请选择较小的图片文件。`);
                return; // 不关闭对话框，让用户重新选择
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                callback(e.target.result);
            };
            reader.readAsDataURL(file);
            document.body.removeChild(dialog);
        } else {
            alert('请选择有效的图片文件！');
        }
    };
    
    const handleCancel = () => {
        callback(null);
        document.body.removeChild(dialog);
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    
    buttonContainer.appendChild(confirmBtn);
    buttonContainer.appendChild(cancelBtn);
    
    content.appendChild(title);
    content.appendChild(fileInput);
    content.appendChild(previewContainer);
    content.appendChild(buttonContainer);
    dialog.appendChild(content);
    document.body.appendChild(dialog);
}

// 显示图片预览
function showImagePreview(imageData) {
    const modal = document.getElementById('image-preview-modal');
    const largeImage = document.getElementById('large-image-preview');
    largeImage.src = imageData;
    showModal('image-preview-modal');
}

// 视图切换函数
function showHomepage() {
    document.getElementById('homepage-view').classList.add('active');
    document.getElementById('detail-view').classList.remove('active');
    document.getElementById('back-btn').style.display = 'none';
    renderTaskList();
}

function showDetailView() {
    document.getElementById('homepage-view').classList.remove('active');
    document.getElementById('detail-view').classList.add('active');
    document.getElementById('back-btn').style.display = 'block';
    renderContentList();
}

// 渲染任务列表（首页）
function renderTaskList() {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';

    if (tasks.length === 0) {
        taskList.innerHTML = '<div style="text-align: center; color: #999; padding: 40px; grid-column: 1 / -1;">还没有任务，点击"创建新任务"开始</div>';
        return;
    }

    tasks.forEach((task, index) => {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        
        const taskCardHeader = document.createElement('div');
        taskCardHeader.className = 'task-card-header';
        
        const taskCardName = document.createElement('div');
        taskCardName.className = 'task-card-name';
        taskCardName.textContent = task.name;
        
        const taskCardInfo = document.createElement('div');
        taskCardInfo.className = 'task-card-info';
        const createdDate = new Date(task.created).toLocaleDateString();
        const itemCount = task.items ? task.items.length : 0;
        taskCardInfo.textContent = `创建时间: ${createdDate} | 内容数量: ${itemCount}`;
        
        // 添加内容预览区域
        const taskCardPreview = document.createElement('div');
        taskCardPreview.className = 'task-card-preview';
        taskCardPreview.style.cssText = 'margin: 15px 0; max-height: 120px; overflow: hidden;';
        
        if (task.items && task.items.length > 0) {
            task.items.forEach((item, itemIndex) => {
                if (itemIndex < 3) { // 只显示前3条内容
                    const previewItem = document.createElement('div');
                    previewItem.style.cssText = 'margin-bottom: 8px; padding: 8px; background: #f8f9fa; border-radius: 4px; font-size: 12px;';
                    
                    if (item.type === 'text') {
                        const textPreview = item.content.length > 50 ? item.content.substring(0, 50) + '...' : item.content;
                        previewItem.innerHTML = textPreview;
                    } else if (item.type === 'image') {
                        previewItem.innerHTML = `<img src="${item.content}" style="max-width: 100%; max-height: 60px; object-fit: contain; border-radius: 2px;">`;
                    }
                    
                    taskCardPreview.appendChild(previewItem);
                }
            });
        } else {
            const noContent = document.createElement('div');
            noContent.style.cssText = 'color: #999; font-style: italic; text-align: center; padding: 20px;';
            noContent.textContent = '暂无内容';
            taskCardPreview.appendChild(noContent);
        }
        
        const taskCardActions = document.createElement('div');
        taskCardActions.className = 'task-card-actions';
        
        // 左侧：执行按钮
        const taskCardActionsLeft = document.createElement('div');
        taskCardActionsLeft.className = 'task-card-actions-left';
        
        // 执行按钮
        const executeBtn = document.createElement('button');
        executeBtn.className = 'btn btn-gradient btn-small expanded';
        executeBtn.textContent = '执行';
        executeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentTaskIndex = index;
            currentTask = task;
            saveCurrentTaskIndex();
            executeTaskFromHomepage();
        });
        
        taskCardActionsLeft.appendChild(executeBtn);
        
        // 右侧：编辑和三个点菜单按钮
        const taskCardActionsRight = document.createElement('div');
        taskCardActionsRight.className = 'task-card-actions-right';
        
        // 编辑按钮
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-primary btn-small expanded';
        editBtn.textContent = '编辑';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentTaskIndex = index;
            currentTask = task;
            saveCurrentTaskIndex();
            showDetailView();
            addLog(`进入任务编辑: ${task.name}`, 'info');
        });
        
        // 三个点菜单按钮
        const moreBtn = document.createElement('button');
        moreBtn.className = 'btn btn-small';
        moreBtn.style.cssText = 'background: #f8f9fa; color: #666; border: 1px solid #ddd; min-width: 32px;';
        moreBtn.innerHTML = '⋯';
        
        // 创建下拉菜单
        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'dropdown-menu';
        
        const deleteMenuItem = document.createElement('button');
        deleteMenuItem.className = 'dropdown-item delete';
        deleteMenuItem.textContent = '删除';
        deleteMenuItem.addEventListener('click', () => {
            if (confirm(`确定要删除任务"${task.name}"吗？`)) {
                deleteTask(index);
            }
            dropdownMenu.classList.remove('show');
        });
        
        dropdownMenu.appendChild(deleteMenuItem);
        
        moreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // 切换下拉菜单的显示状态
            dropdownMenu.classList.toggle('show');
        });
        
        // 点击其他地方关闭下拉菜单
        document.addEventListener('click', (e) => {
            if (!moreBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('show');
            }
        });
        
        taskCardActionsRight.appendChild(editBtn);
        taskCardActionsRight.appendChild(moreBtn);
        taskCardActionsRight.appendChild(dropdownMenu);
        
        taskCardActions.appendChild(taskCardActionsLeft);
        taskCardActions.appendChild(taskCardActionsRight);
        
        taskCardHeader.appendChild(taskCardName);
        taskCardHeader.appendChild(taskCardInfo);
        
        taskCard.appendChild(taskCardHeader);
        taskCard.appendChild(taskCardPreview);
        taskCard.appendChild(taskCardActions);
        
        taskList.appendChild(taskCard);
    });
}

// 从首页执行任务
async function executeTaskFromHomepage() {
    if (!currentTask || !currentTask.items || !currentTask.items.length === 0) {
        addLog('当前任务没有内容，无法执行', 'warning');
        return;
    }
    
    addLog(`开始执行任务: ${currentTask.name}`, 'info');
    addLog(`共 ${currentTask.items.length} 条内容`, 'info');
    
    // 显示toast提示
    showToast('请点击输入框，3秒后会自动发送信息', 3000);
    
    // 显示倒计时提示
    addLog('请鼠标点击输入框，任务即将开始执行...', 'warning');
    
    const executeBtn = document.getElementById('execute-btn');
    executeBtn.disabled = true;
    executeBtn.textContent = '执行中...';
    
    try {
        for (let i = 0; i < currentTask.items.length; i++) {
            const item = currentTask.items[i];
            
            if (i === 0) {
                // 第一条内容：显示动态倒计时
                addLog(`正在发送第 ${i + 1} 条（共 ${currentTask.items.length} 条），请勿切换窗口...`, 'info');
                
                // 动态倒计时显示
                for (let countdown = 3; countdown > 0; countdown--) {
                    addLog(`${countdown}秒后开始执行...`, 'info');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } else {
                // 后续内容：快速执行，不用等太久
                addLog(`正在发送第 ${i + 1} 条（共 ${currentTask.items.length} 条），请勿切换窗口...`, 'info');
                // 只等待0.5秒
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // 添加详细的调试日志
            console.log(`🔍 调试 - 准备发送第 ${i + 1} 条内容:`, item);
            console.log(`🔍 调试 - 内容类型:`, item.type);
            console.log(`🔍 调试 - 内容内容:`, item.content);
            console.log(`🔍 调试 - 内容长度:`, item.content ? item.content.length : 'undefined');
            
            try {
                const result = await ipcRenderer.invoke('send-item', item);
                console.log(`🔍 调试 - IPC调用结果:`, result);
                addLog(`第 ${i + 1} 条发送成功`, 'success');
            } catch (error) {
                console.log(`🔍 调试 - IPC调用失败:`, error);
                addLog(`第 ${i + 1} 条发送失败：${error.message}`, 'error');
            }
        }
    } catch (error) {
        addLog(`执行过程中出现错误：${error.message}`, 'error');
    }
    
    addLog('所有内容都已发送完毕。若需重新执行，请点击"开始执行"。', 'success');
    executeBtn.disabled = false;
    executeBtn.textContent = '开始执行';
}

// 选择任务
function selectTask(index) {
    if (index >= 0 && index < tasks.length) {
        currentTaskIndex = index;
        currentTask = tasks[index];
        saveCurrentTaskIndex();
        showDetailView();
        addLog(`切换到任务: ${currentTask.name}`, 'info');
    }
}

// 渲染内容列表（详情页）
function renderContentList() {
    const contentList = document.getElementById('content-list');
    const taskNameDisplay = document.getElementById('task-name-display');
    
    // 显示任务名称
    if (taskNameDisplay && currentTask) {
        taskNameDisplay.textContent = currentTask.name;
    }
    
    contentList.innerHTML = '';

    if (!currentTask || !currentTask.items) {
        contentList.innerHTML = '<div style="text-align: center; color: #999; padding: 40px;">当前任务还没有内容，点击"添加文字"或"添加图片"开始</div>';
        return;
    }

    currentTask.items.forEach((item, index) => {
        const contentItem = document.createElement('div');
        contentItem.className = 'content-item';

        const contentPreview = document.createElement('div');
        contentPreview.className = 'content-preview';

        if (item.type === 'text') {
            contentPreview.textContent = item.content;
        } else if (item.type === 'image') {
            // 图片预览功能
            const imagePreview = document.createElement('img');
            imagePreview.src = item.content;
            imagePreview.style.cssText = `
                max-width: 100px;
                max-height: 60px;
                border-radius: 4px;
                border: 1px solid #ddd;
                object-fit: cover;
            `;
            imagePreview.title = '点击查看大图';
            
            // 点击图片可以查看大图
            imagePreview.addEventListener('click', () => {
                showImagePreview(item.content);
            });
            
            contentPreview.appendChild(imagePreview);
        }

        const contentActionsBtns = document.createElement('div');
        contentActionsBtns.className = 'content-actions-btns';

        // 编辑按钮
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-primary btn-small';
        editBtn.textContent = '编辑';
        editBtn.addEventListener('click', () => {
            editContentItem(index);
        });

        // 删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-small';
        deleteBtn.textContent = '删除';
        deleteBtn.addEventListener('click', () => {
            deleteContentItem(index);
        });

        contentActionsBtns.appendChild(editBtn);
        contentActionsBtns.appendChild(deleteBtn);

        contentItem.appendChild(contentPreview);
        contentItem.appendChild(contentActionsBtns);
        contentList.appendChild(contentItem);
    });

    if (currentTask.items.length === 0) {
        contentList.innerHTML = '<div style="text-align: center; color: #999; padding: 40px;">当前任务还没有内容，点击"添加文字"或"添加图片"开始</div>';
    }
}

// 编辑内容项
function editContentItem(index) {
    const item = currentTask.items[index];
    if (item.type === 'text') {
        // 显示文字编辑弹窗并自动加载之前的内容
        showTextEditDialog(item.content, (newContent) => {
            if (newContent !== null) {
                currentTask.items[index].content = newContent;
                renderContentList();
                addLog(`编辑文字内容成功`, 'success');
                showToast('文字内容编辑成功！', 2000);
            }
        });
    } else if (item.type === 'image') {
        showImageFileDialog((newImageData) => {
            if (newImageData !== null) {
                currentTask.items[index].content = newImageData;
                renderContentList();
                addLog(`编辑图片内容成功`, 'success');
            }
        });
    }
}

// 删除内容项
function deleteContentItem(index) {
    if (confirm('确定要删除这个内容吗？')) {
        currentTask.items.splice(index, 1);
        renderContentList();
        addLog('删除内容成功', 'success');
    }
}

// 创建新任务
function createNewTask() {
    const nameInput = document.getElementById('task-name-input');
    
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('请输入任务名称');
        return;
    }
    
    const newTask = {
        id: Date.now(),
        name: name,
        description: '',
        created: Date.now(),
        items: []
    };
    
    tasks.push(newTask);
    currentTaskIndex = tasks.length - 1;
    currentTask = newTask;
    
    saveTasks();
    saveCurrentTaskIndex();
    
    // 清空输入框
    nameInput.value = '';
    
    // 隐藏弹窗并刷新显示
    hideModal('task-modal');
    renderTaskList();
    
    addLog(`创建新任务: ${name}`, 'success');
    showToast(`任务"${name}"创建成功！`, 2000);
}

// 删除任务
function deleteTask(index) {
    if (index === currentTaskIndex) {
        currentTaskIndex = 0;
        currentTask = tasks[0];
        saveCurrentTaskIndex();
    }
    
    const deletedTask = tasks[index];
    tasks.splice(index, 1);
    
    // 如果删除的是当前任务，切换到第一个任务
    if (currentTaskIndex >= tasks.length) {
        currentTaskIndex = 0;
        currentTask = tasks[0];
        saveCurrentTaskIndex();
    }
    
    saveTasks();
    renderTaskList();
    
    addLog(`删除任务: ${deletedTask.name}`, 'info');
    showToast(`任务"${deletedTask.name}"删除成功！`, 2000);
}

// 添加文字内容
function addTextContent() {
    console.log('🔍 调试 - addTextContent 函数被调用');
    console.log('🔍 调试 - 当前任务:', currentTask);
    console.log('🔍 调试 - 当前任务索引:', currentTaskIndex);
    showModal('text-modal');
    console.log('🔍 调试 - 文字输入弹窗已显示');
}

// 添加图片内容
function addImageContent() {
    showImageFileDialog((imageData) => {
        if (imageData !== null) {
            if (!currentTask.items) {
                currentTask.items = [];
            }
            
            currentTask.items.push({
                type: 'image',
                content: imageData
            });
            
            renderContentList();
            addLog('添加图片内容成功', 'success');
            showToast('图片内容添加成功！', 2000);
        }
    });
}

// 保存内容
function saveContent() {
    saveTasks();
    addLog('内容保存成功', 'success');
    showToast('内容保存成功！', 2000);
}

// 执行任务（详情页）
async function executeTask() {
    if (!currentTask || !currentTask.items || !currentTask.items.length === 0) {
        addLog('当前任务没有内容，无法执行', 'warning');
        return;
    }
    
    addLog(`开始执行任务: ${currentTask.name}`, 'info');
    addLog(`共 ${currentTask.items.length} 条内容`, 'info');
    
    // 显示toast提示
    showToast('请点击输入框，3秒后会自动发送信息', 3000);
    
    // 显示倒计时提示
    addLog('请鼠标点击输入框，任务即将开始执行...', 'warning');
    
    const executeBtn = document.getElementById('execute-btn');
    executeBtn.disabled = true;
    executeBtn.textContent = '执行中...';
    
    try {
        for (let i = 0; i < currentTask.items.length; i++) {
            const item = currentTask.items[i];
            
            if (i === 0) {
                // 第一条内容：显示动态倒计时
                addLog(`正在发送第 ${i + 1} 条（共 ${currentTask.items.length} 条），请勿切换窗口...`, 'info');
                
                // 动态倒计时显示
                for (let countdown = 3; countdown > 0; countdown--) {
                    addLog(`${countdown}秒后开始执行...`, 'info');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } else {
                // 后续内容：快速执行，不用等太久
                addLog(`正在发送第 ${i + 1} 条（共 ${currentTask.items.length} 条），请勿切换窗口...`, 'info');
                // 只等待0.5秒
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // 添加详细的调试日志
            console.log(`🔍 调试 - 准备发送第 ${i + 1} 条内容:`, item);
            console.log(`🔍 调试 - 内容类型:`, item.type);
            console.log(`🔍 调试 - 内容内容:`, item.content);
            console.log(`🔍 调试 - 内容长度:`, item.content ? item.content.length : 'undefined');
            
            try {
                const result = await ipcRenderer.invoke('send-item', item);
                console.log(`🔍 调试 - IPC调用结果:`, result);
                addLog(`第 ${i + 1} 条发送成功`, 'success');
            } catch (error) {
                console.log(`🔍 调试 - IPC调用失败:`, error);
                addLog(`第 ${i + 1} 条发送失败：${error.message}`, 'error');
            }
        }
    } catch (error) {
        addLog(`执行过程中出现错误：${error.message}`, 'error');
    }
    
    addLog('所有内容都已发送完毕。若需重新执行，请点击"开始执行"。', 'success');
    executeBtn.disabled = false;
    executeBtn.textContent = '开始执行';
}

// 显示文字编辑弹窗
function showTextEditDialog(currentContent, callback) {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        width: 90%;
        max-width: 400px;
    `;

    const title = document.createElement('div');
    title.style.cssText = `
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 15px;
        color: #333;
    `;
    title.textContent = '编辑文字内容';

    const textInput = document.createElement('textarea');
    textInput.style.cssText = `
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        margin-bottom: 15px;
        box-sizing: border-box;
        min-height: 100px;
        resize: vertical;
    `;
    textInput.value = currentContent;
    textInput.focus();

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 10px;
        justify-content: flex-end;
    `;

    const confirmBtn = document.createElement('button');
    confirmBtn.style.cssText = `
        padding: 8px 16px;
        background: #000000;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    `;
    confirmBtn.textContent = '确定';

    const cancelBtn = document.createElement('button');
    cancelBtn.style.cssText = `
        padding: 8px 16px;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    `;
    cancelBtn.textContent = '取消';

    const handleConfirm = () => {
        const value = textInput.value.trim();
        if (value) {
            callback(value);
        }
        document.body.removeChild(dialog);
    };

    const handleCancel = () => {
        callback(null);
        document.body.removeChild(dialog);
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    textInput.addEventListener('click', (e) => {
        if (e.key === 'Enter') {
            handleConfirm();
        }
    });

    buttonContainer.appendChild(confirmBtn);
    buttonContainer.appendChild(cancelBtn);

    content.appendChild(title);
    content.appendChild(textInput);
    content.appendChild(buttonContainer);
    dialog.appendChild(content);
    document.body.appendChild(dialog);
}

// 页面加载完成后的初始化
window.addEventListener('DOMContentLoaded', () => {
    console.log("🕒 DOMContentLoaded：页面 DOM 已经完全加载");
    
    // 加载任务数据
    tasks = loadTasks();
    currentTaskIndex = loadCurrentTaskIndex();
    currentTask = tasks[currentTaskIndex];
    
    // 绑定事件监听器
    document.getElementById('create-task-btn').addEventListener('click', () => {
        showModal('task-modal');
    });
    
    document.getElementById('back-btn').addEventListener('click', () => {
        showHomepage();
    });
    
    document.getElementById('add-text-btn').addEventListener('click', addTextContent);
    
    document.getElementById('add-image-btn').addEventListener('click', addImageContent);
    
    document.getElementById('save-content-btn').addEventListener('click', saveContent);
    
    document.getElementById('execute-btn').addEventListener('click', executeTask);
    
    // 任务创建弹窗事件
    document.getElementById('create-task-confirm').addEventListener('click', createNewTask);
    document.getElementById('create-task-cancel').addEventListener('click', () => {
        hideModal('task-modal');
    });
    
    // 文字输入弹窗事件
    document.getElementById('text-confirm').addEventListener('click', () => {
        console.log('🔍 调试 - 文字确认按钮被点击');
        const content = document.getElementById('text-input').value.trim();
        console.log('🔍 调试 - 输入的文字内容:', content);
        if (content) {
            console.log('🔍 调试 - 开始添加文字内容到任务');
            // 直接添加文字内容，而不是调用 addTextContent()
            if (!currentTask.items) {
                currentTask.items = [];
            }
            
            currentTask.items.push({
                type: 'text',
                content: content
            });
            
            console.log('🔍 调试 - 文字内容已添加到任务，当前任务内容:', currentTask.items);
            renderContentList();
            addLog('添加文字内容成功', 'success');
            showToast('文字内容添加成功！', 2000);
        }
        hideModal('text-modal');
        document.getElementById('text-input').value = '';
    });
    document.getElementById('text-cancel').addEventListener('click', () => {
        hideModal('text-modal');
        document.getElementById('text-input').value = '';
    });
    
    // 文字输入框支持多行编辑
    document.getElementById('text-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            // Ctrl+Enter 提交
            e.preventDefault();
            document.getElementById('text-confirm').click();
        } else if (e.key === 'Enter' && !e.shiftKey) {
            // 普通 Enter 键创建新行
            e.preventDefault();
            const textarea = e.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const value = textarea.value;
            textarea.value = value.substring(0, start) + '\n' + value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + 1;
        }
    });
    
    // 图片上传弹窗事件
    document.getElementById('image-confirm').addEventListener('click', () => {
        const fileInput = document.getElementById('image-file-input');
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            if (file.type.startsWith('image/')) {
                // 检查文件大小（2MB = 2 * 1024 * 1024 bytes）
                const maxSize = 2 * 1024 * 1024; // 2MB
                if (file.size > maxSize) {
                    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                    alert(`图片文件过大！当前大小：${sizeMB}MB，最大允许：2MB。请选择较小的图片文件。`);
                    return; // 不关闭对话框，让用户重新选择
                }
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    addImageContent(e.target.result);
                };
                reader.readAsDataURL(file);
                hideModal('image-modal');
                fileInput.value = '';
                document.getElementById('image-preview-container').innerHTML = '<div style="color: #999;">请选择图片文件</div>';
            }
        }
    });
    document.getElementById('image-cancel').addEventListener('click', () => {
        hideModal('image-modal');
        fileInput.value = '';
        document.getElementById('image-preview-container').innerHTML = '<div style="color: #999;">请选择图片文件</div>';
    });
    
    // 图片文件选择预览
    document.getElementById('image-file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            // 检查文件大小（2MB = 2 * 1024 * 1024 bytes）
            const maxSize = 2 * 1024 * 1024; // 2MB
            if (file.size > maxSize) {
                const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                alert(`图片文件过大！当前大小：${sizeMB}MB，最大允许：2MB。请选择较小的图片文件。`);
                e.target.value = ''; // 清空文件选择
                const previewContainer = document.getElementById('image-preview-container');
                previewContainer.innerHTML = '<div style="color: #999;">请选择图片文件</div>';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewContainer = document.getElementById('image-preview-container');
                previewContainer.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 200px; object-fit: contain;">`;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // 图片大图预览弹窗关闭
    document.getElementById('image-preview-close').addEventListener('click', () => {
        hideModal('image-preview-modal');
    });
    
    // 点击弹窗外部关闭弹窗
    window.addEventListener('click', (e) => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // 设置底部链接点击事件，使用系统默认浏览器打开
    const footerLink = document.getElementById('footer-link');
    if (footerLink) {
        footerLink.addEventListener('click', (e) => {
            e.preventDefault();
            // 使用 Electron 的 shell 模块打开外部链接
            require('electron').shell.openExternal('https://thiflow.com');
        });
    }
    
    // 任务名称编辑功能
    const editTaskNameBtn = document.getElementById('edit-task-name-btn');
    const saveTaskNameBtn = document.getElementById('save-task-name-btn');
    const taskNameDisplay = document.getElementById('task-name-display');
    const taskNameEditInput = document.getElementById('task-name-edit-input');
    
    if (editTaskNameBtn && saveTaskNameBtn && taskNameDisplay && taskNameEditInput) {
        // 编辑任务名称
        editTaskNameBtn.addEventListener('click', () => {
            taskNameDisplay.style.display = 'none';
            taskNameEditInput.style.display = 'block';
            taskNameEditInput.value = currentTask.name;
            editTaskNameBtn.style.display = 'none';
            saveTaskNameBtn.style.display = 'inline-block';
            taskNameEditInput.focus();
            taskNameEditInput.select();
        });
        
        // 保存任务名称
        saveTaskNameBtn.addEventListener('click', () => {
            const newName = taskNameEditInput.value.trim();
            if (!newName) {
                alert('任务名称不能为空！');
                return;
            }
            
            // 更新任务名称
            currentTask.name = newName;
            saveTasks();
            
            // 更新显示
            taskNameDisplay.textContent = newName;
            taskNameDisplay.style.display = 'block';
            taskNameEditInput.style.display = 'none';
            editTaskNameBtn.style.display = 'inline-block';
            saveTaskNameBtn.style.display = 'none';
            
            // 刷新任务列表以显示新名称
            renderTaskList();
            
            addLog(`任务名称已更新为: ${newName}`, 'success');
            showToast('任务名称更新成功！', 2000);
        });
        
        // 按Enter键保存任务名称
        taskNameEditInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveTaskNameBtn.click();
            } else if (e.key === 'Escape') {
                // 按ESC键取消编辑
                taskNameDisplay.style.display = 'block';
                taskNameEditInput.style.display = 'none';
                editTaskNameBtn.style.display = 'inline-block';
                saveTaskNameBtn.style.display = 'none';
            }
        });
    }
    
    // 初始化渲染
    showHomepage();
    addLog('应用启动完成', 'info');
    
    console.log("✅ 所有事件监听器已绑定，应用初始化完成");
});
