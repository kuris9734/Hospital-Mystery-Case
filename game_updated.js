// 游戏状态管理
class GameState {
    constructor() {
        this.currentScene = 'corridor'; // 医院大厅
        this.solvedPuzzles = [];
        this.unlockedRooms = new Set(['corridor']);
        this.gameProgress = {
            puzzlesSolved: 0,
            totalPuzzles: 7
        };
        this.detectionRisk = 0;
        this.room717WindowChecked = false; // 跟踪717房间是否已检查窗户
        this.vigenereDescClicked = false; // 跟踪维吉尼亚密码描述是否已被点击
        this.fireExitUsed = false; // 跟踪是否已使用过消防通道
        this.operatingRoomNurseSeen = false; // 跟踪是否已看过手术室护士离开的动画
        this.operatingRoomClueFound = false; // 跟踪是否已找到护理记录
        this.operatingRoomClueViewed = false; // 跟踪是否已查看过护理记录
        this.operatingRoomClickedAreas = []; // 记录已点击的正确区域ID
        this.operatingRoomWrongClickedAreas = []; // 记录已点击的错误区域ID
        this.hasCorrectNursingRecord = false; // 跟踪是否收集到正确的护理记录（点击了3个正确区域）
        this.isFloor2SequenceActive = false; // 跟踪是否正在执行2楼特殊流程，防止重复触发
        this.floor2SequenceTriggered = false; // 跟踪是否已经触发过2楼特殊流程（保安音频），确保只触发一次
        this.electricBoxChecked = false; // 跟踪是否检查过电梯电箱
        this.electricBoxWiringFixed = false; // 跟踪是否修复了电梯电箱的接线
        this.hasElevatorCard = false; // 跟踪是否获得了电梯卡（通过电箱连线解锁获得）
        this.isRoom203 = false; // 跟踪当前room_717场景是作为203病房还是717病房
        this.room203KeyUsed = false; // 跟踪是否已经使用过203钥匙打开203病房
        this.room203PatientAwake = false; // 跟踪203病人是否已经清醒
        this.room203DialogueStep = 0; // 跟踪203病人对话进度：0=未开始，1=已显示第一段对话，2=已显示第二段对话
        this.basementPasswordEntered = false; // 跟踪是否已输入地下室密码
        this.basementCluesCollected = []; // 跟踪已收集的地下室线索
        this.basementComputerUnlocked = false; // 跟踪是否已解锁电脑
    }


    solvePuzzle(puzzleId) {
        if (!this.solvedPuzzles.includes(puzzleId)) {
            this.solvedPuzzles.push(puzzleId);
            this.gameProgress.puzzlesSolved++;
            this.updateProgress();
            return true;
        }
        return false;
    }

    unlockRoom(roomId) {
        this.unlockedRooms.add(roomId);
        this.updateMapStatus();
    }

    increaseDetectionRisk(amount) {
        this.detectionRisk = Math.min(100, this.detectionRisk + amount);
        if (this.detectionRisk >= 80 && Math.random() < 0.3) {
            triggerFailureEnding();
        }
    }

    updateProgress() {
        // 进度显示已移除，此函数保留以防其他地方调用
        // 不再更新任何进度显示
    }
    
    updateRiskLevel() {
        // 风险值显示已移除，此函数保留以防其他地方调用
    }

        updateMapStatus() {
        const mapRooms = {
            'map_operating': this.unlockedRooms.has('operating'),
            'map_room717': this.unlockedRooms.has('room_717'),
            'map_director': this.unlockedRooms.has('director'),
            'map_monitor': this.unlockedRooms.has('monitor')
        };
        
        Object.keys(mapRooms).forEach(roomId => {
            const element = document.getElementById(roomId);
            if (element) {
                if (mapRooms[roomId]) {
                    element.className = 'bg-blue-600 p-4 rounded-lg text-center cursor-pointer hover:bg-blue-700 transition-colors';
                } else {
                    element.className = 'bg-gray-800 p-4 rounded-lg text-center text-gray-500 cursor-not-allowed';
                }
            }
        });
    }
}

// 密码工具函数
const CipherUtils = {
    // 栅栏密码解码
    railFenceDecode(ciphertext, rails = 2) {
        if (rails < 2) return ciphertext;
        const len = ciphertext.length;
        const cycle = 2 * (rails - 1);
        const result = new Array(len);
        let index = 0;
        
        for (let row = 0; row < rails; row++) {
            let pos = row;
            let step1 = 2 * (rails - row - 1);
            let step2 = 2 * row;
            
            if (step1 === 0) step1 = cycle;
            if (step2 === 0) step2 = cycle;
            
            let useStep1 = true;
            while (pos < len) {
                result[pos] = ciphertext[index++];
                pos += useStep1 ? step1 : step2;
                useStep1 = !useStep1;
            }
        }
        return result.join('');
    },
    
    // 维吉尼亚密码解码
    vigenereDecode(ciphertext, key) {
        key = key.toUpperCase().replace(/[^A-Z]/g, '');
        ciphertext = ciphertext.toUpperCase().replace(/[^A-Z]/g, '');
        let result = '';
        for (let i = 0; i < ciphertext.length; i++) {
            const c = ciphertext.charCodeAt(i) - 65;
            const k = key.charCodeAt(i % key.length) - 65;
            const decoded = ((c - k + 26) % 26) + 65;
            result += String.fromCharCode(decoded);
        }
        return result;
    },
    
    // 培根密码解码
    baconDecode(ciphertext) {
        const baconMap = {
            'AAAAA': 'A', 'AAAAB': 'B', 'AAABA': 'C', 'AAABB': 'D', 'AABAA': 'E',
            'AABAB': 'F', 'AABBA': 'G', 'AABBB': 'H', 'ABAAA': 'I', 'ABAAB': 'J',
            'ABABA': 'K', 'ABABB': 'L', 'ABBAA': 'M', 'ABBAB': 'N', 'ABBBA': 'O',
            'ABBBB': 'P', 'BAAAA': 'Q', 'BAAAB': 'R', 'BAABA': 'S', 'BAABB': 'T',
            'BABAA': 'U', 'BABAB': 'V', 'BABBA': 'W', 'BABBB': 'X', 'BBAAA': 'Y',
            'BBAAB': 'Z'
        };
        
        ciphertext = ciphertext.toUpperCase().replace(/[^AB]/g, '');
        let result = '';
        for (let i = 0; i < ciphertext.length; i += 5) {
            const chunk = ciphertext.substr(i, 5);
            if (chunk.length === 5 && baconMap[chunk]) {
                result += baconMap[chunk];
            }
        }
        return result;
    }
};

// 谜题定义
const puzzles = {
    // 谜题1：楼层选择
    floor_selection: {
        id: 'floor_selection',
        name: '选择楼层',
        description: '根据各科室楼层分布，选择要前往的楼层。',
        question: '输入要前往的楼层数字（例如：7）',
        solution: '7',
        type: 'text',
        onSolve: () => {
            gameState.unlockRoom('room_717');
            showDescription('你选择了7楼，电梯启动了。');
        }
    },
    
    // 谜题2：栅栏密码（已删除，手术室现在通过消防通道进入）
    
    // 谜题3：维吉尼亚密码
    vigenere: {
        id: 'vigenere',
        name: '维吉尼亚密码',
        description: '纸条上凌乱的字迹写着：ZBZCTBBMSQ',
        question: '', // 不显示提示文字
        solution: 'shoushushi',
        key: 'HULIBU', // 解码钥匙：护理部的拼音
        type: 'text',
        onSolve: () => {
            showDescription('要去手术室看看？旁边的病房有人 ，最好从消防通道离开。');
        }
    },
    
    // 谜题4：培根密码
    bacon: {
        id: 'bacon',
        name: '培根密码',
        description: '监控室的屏幕上显示：AABBA ABBAA ABBAB ABBAA ABBBA',
        question: '解码这段培根密码',
        solution: 'HIDDEN',
        type: 'text',
        onSolve: () => {
            gameState.unlockRoom('monitor');
            showDescription('解码成功！监控室的门打开了。');
        }
    },
    
    // 谜题5：颜色接线
    color_wiring: {
        id: 'color_wiring',
        name: '颜色接线',
        description: '院长室的保险箱需要按照颜色顺序接线。左侧：红-蓝-绿-黄-紫，右侧：蓝-红-黄-绿-紫。按照对应颜色连接。',
        question: '输入右侧连接顺序（用-分隔，例如：2-1-4-3-5）',
        solution: '2-1-4-3-5',
        type: 'text',
        onSolve: () => {
            gameState.unlockRoom('director');
            showDescription('接线正确！保险箱打开了。');
        }
    },
    
    // 谜题6：配药
    medicine_mix: {
        id: 'medicine_mix',
        name: '配药谜题',
        description: '配药室需要按照比例配药：\nA药：B药：C药 = 3:2:1\n总量需要30ml',
        question: 'A药需要多少ml？',
        solution: '15',
        type: 'text',
        onSolve: () => {
            showDescription('配药正确！获得了关键线索。');
        }
    },
    
    // 谜题7：数字组合
    number_combination: {
        id: 'number_combination',
        name: '数字组合',
        description: '电梯需要输入密码。线索：\n监控时间：02:13\n照片日期：12月25日\n录音器：2471',
        question: '按时间顺序组合数字（格式：HHMMDDMM）',
        solution: '02131225',
        type: 'text',
        onSolve: () => {
            showDescription('密码正确！');
        }
    },
    
    // 谜题8：电梯电箱接线
    electric_box_wiring: {
        id: 'electric_box_wiring',
        name: '电箱接线',
        description: '发现一个箱子，需要连线解锁。里面好像有东西',
        question: '',
        solution: '', // 不再使用文本输入
        type: 'wiring', // 连线类型
        onSolve: () => {
            gameState.electricBoxWiringFixed = true;
            gameState.hasElevatorCard = true; // 获得电梯卡
            showDescription('连线成功！里面是一张备用电梯卡。');
            // 清除电箱热点
            clearHotspots();
        }
    },
    
    // 谜题9：最终真相
    final_truth: {
        id: 'final_truth',
        name: '揭露真相',
        description: '你已经收集了所有证据。现在需要输入最终密码来揭露真相。\n将所有解码后的关键词组合：SHOUSHUSHI-HIDDEN-02131225',
        question: '输入最终密码（用-连接所有关键词）',
        solution: 'SHOUSHUSHI-HIDDEN-02131225',
        type: 'text',
        onSolve: () => {
            checkEnding();
        }
    }
};

// 游戏数据
const gameData = {
    scenes: {
        corridor: {
            name: '医院大厅',
            background: 'scene_hospital_corridor.png',
            description: '你来到医院大厅，这里空无一人，没有任何人接待，灯光时亮时灭。',
            observables: [
                {
                    id: 'elevator',
                    name: '电梯',
                    action: () => {
                        // 检查是否获得了电梯卡（通过电箱连线解锁获得）
                        if (gameState.hasElevatorCard) {
                            showDescription('你使用电梯卡打开了电梯。电梯可以使用了。');
                            // 可以在这里添加电梯选择楼层的功能
                        } else {
                            showDescription('你按了电梯按钮，但电梯没有任何反应。');
                        }
                    }
                },
                {
                    id: 'floor_map',
                    name: '各科室楼层分布',
                    action: () => {
                        showFloorMapModal();
                    }
                }
            ]
        },
        room_717: {
            name: '717房间',
            background: 'scene_ward_third_floor.png',
            description: '717房间。房间里也没有人，但床单凌乱。',
            locked: false,
            observables: []
        },
        operating: {
            name: '手术室',
            background: 'scene_operating_room.png',
            description: '', // 描述由showNurseAnimation()动态显示，不在这里设置
            locked: false, // 通过消防通道进入，不需要谜题解锁
            requiredPuzzle: null, // 不再需要栅栏密码谜题
            observables: [] // 旧的配药室相关observables已删除
        },
        floor_2: {
            name: '2楼',
            background: 'scene_hospital_corridor.png', // 暂时使用医院大厅背景，后续可替换
            description: '躲在消防通道听到保安渐渐走远了，现在该去哪里？',
            locked: false,
            observables: [
                {
                    id: 'room_203',
                    name: '203房间',
                    action: () => {
                        showDescription('你来到了203房间门口。门是锁着的，需要钥匙才能打开。');
                        // 可以在这里添加钥匙相关的谜题或交互
                    }
                }
            ]
        },
        floor_3: {
            name: '3楼',
            background: 'scene_hospital_corridor.png', // 暂时使用医院大厅背景，后续可替换
            description: '你来到了3楼。刚才听到的打电话声音似乎已经消失了。',
            locked: false,
            observables: []
        },
        monitor: {
            name: '监控室',
            background: 'scene_monitoring_room.png',
            description: '你进入了医院的监控室。找到了助手所说的设计师被带走的时间段。屏幕上，设计师对着监控在拼命比划手势。',
            locked: true,
            requiredPuzzle: 'bacon',
            observables: [
                {
                    id: 'bacon_screen',
                    name: '查看屏幕',
                    action: () => {
                        handleMonitorScreenClick();
                    }
                }
            ]
        },
        director: {
            name: '院长室',
            background: 'scene_director_office.png',
            description: '你进入了院长室。墙上有一个保险箱。',
            locked: true,
            requiredPuzzle: 'vigenere',
            observables: [
                {
                    id: 'color_wiring',
                    name: '检查保险箱',
                    action: () => {
                        showPuzzleModal('color_wiring');
                    }
                }
            ]
        },
        archive: {
            name: '三楼电工房',
            background: 'scene_experimental_archive.png',
            description: '你来到了三楼电工房。',
            locked: false,
            requiredPuzzle: null,
            observables: [
                {
                    id: 'key_203',
                    name: '203钥匙',
                    action: () => {
                        handleKey203Click();
                    }
                },
                {
                    id: 'final',
                    name: '揭露真相',
                    action: () => {
                        if (gameState.solvedPuzzles.length >= 7) {
                            showPuzzleModal('final_truth');
                        } else {
                            showDescription('你还需要解决更多谜题。');
                        }
                    }
                }
            ]
        },
        underground_elevator: {
            name: '地下电梯',
            background: 'scene_underground_elevator.png',
            description: '你来到了地下电梯。',
            locked: false,
            requiredPuzzle: null,
            observables: [
                {
                    id: 'enter_password',
                    name: '输入密码',
                    action: () => {
                        showUndergroundPasswordModal();
                    }
                }
            ]
        }
    }
};

// 全局游戏状态
let gameState = new GameState();

// ==================== BGM 背景音乐管理 ====================
// BGM音量设置（轻柔背景声）
const BGM_VOLUME = 0.2; // 20%音量，作为轻柔的背景声
const FADE_DURATION = 1000; // 淡入淡出持续时间（毫秒）

// 当前正在播放的BGM
let currentBGM = null;
let isBGMPlaying = false;

// 获取所有BGM音频元素
function getBGMElements() {
    return {
        bgm1: document.getElementById('bgm1Audio'),
        bgm3: document.getElementById('bgm3Audio'),
        bgm4: document.getElementById('bgm4Audio')
    };
}

// 停止所有BGM（柔和淡出）
function stopAllBGM(callback) {
    const bgms = getBGMElements();
    const activeBGM = currentBGM ? bgms[currentBGM] : null;
    
    if (activeBGM && !activeBGM.paused) {
        // 淡出效果
        const fadeOutInterval = setInterval(() => {
            if (activeBGM.volume > 0.05) {
                activeBGM.volume = Math.max(0, activeBGM.volume - 0.05);
            } else {
                clearInterval(fadeOutInterval);
                activeBGM.pause();
                activeBGM.currentTime = 0;
                activeBGM.volume = BGM_VOLUME; // 重置音量以便下次播放
                currentBGM = null;
                isBGMPlaying = false;
                if (callback) callback();
            }
        }, FADE_DURATION / 20);
    } else {
        // 如果没有正在播放的BGM，直接执行回调
        if (callback) callback();
    }
}

// 暂停当前BGM（用于保安音频播放时）
function pauseCurrentBGM() {
    const bgms = getBGMElements();
    const activeBGM = currentBGM ? bgms[currentBGM] : null;
    
    if (activeBGM && !activeBGM.paused) {
        // 柔和淡出
        const fadeOutInterval = setInterval(() => {
            if (activeBGM.volume > 0.05) {
                activeBGM.volume = Math.max(0, activeBGM.volume - 0.05);
            } else {
                clearInterval(fadeOutInterval);
                activeBGM.pause();
            }
        }, FADE_DURATION / 20);
    }
}

// 恢复当前BGM（保安音频播放完成后）
function resumeCurrentBGM() {
    const bgms = getBGMElements();
    const activeBGM = currentBGM ? bgms[currentBGM] : null;
    
    if (activeBGM && activeBGM.paused) {
        activeBGM.volume = 0;
        activeBGM.play().catch(e => {
            console.log('BGM恢复播放失败:', e);
        });
        
        // 淡入效果
        const fadeInInterval = setInterval(() => {
            if (activeBGM.volume < BGM_VOLUME) {
                activeBGM.volume = Math.min(BGM_VOLUME, activeBGM.volume + 0.05);
            } else {
                clearInterval(fadeInInterval);
            }
        }, FADE_DURATION / 20);
    }
}

// 播放指定的BGM
function playBGM(bgmName) {
    const bgms = getBGMElements();
    const targetBGM = bgms[bgmName];
    
    if (!targetBGM) {
        console.error(`BGM ${bgmName} 不存在`);
        return;
    }
    
    // 如果已经在播放相同的BGM，不需要切换
    if (currentBGM === bgmName && !targetBGM.paused) {
        return;
    }
    
    // 停止当前BGM并切换到新的BGM
    stopAllBGM(() => {
        // 设置音量并播放
        targetBGM.volume = 0; // 从0开始淡入
        targetBGM.play().catch(e => {
            console.log(`BGM ${bgmName} 播放失败:`, e);
        });
        
        // 淡入效果
        const fadeInInterval = setInterval(() => {
            if (targetBGM.volume < BGM_VOLUME) {
                targetBGM.volume = Math.min(BGM_VOLUME, targetBGM.volume + 0.05);
            } else {
                clearInterval(fadeInInterval);
            }
        }, FADE_DURATION / 20);
        
        currentBGM = bgmName;
        isBGMPlaying = true;
    });
}

// 根据场景切换BGM
function updateBGMForScene(sceneId) {
    // 检查是否在地下室（已输入密码）
    if (sceneId === 'underground_elevator' && gameState.basementPasswordEntered) {
        playBGM('bgm4');
        return;
    }
    
    // 717房间播放bgm3
    if (sceneId === 'room_717' && !gameState.isRoom203) {
        // 只有是717房间（不是203病房）时才播放bgm3
        playBGM('bgm3');
        return;
    }
    
    // 其他场景播放bgm1（除了保安音频环节）
    // 如果正在执行2楼特殊流程（保安音频），不切换BGM
    if (!gameState.isFloor2SequenceActive) {
        playBGM('bgm1');
    }
}

// ==================== BGM 管理结束 ====================

// 初始化游戏
function initGame() {
    // 预加载保安音频，确保在需要时能够播放
    const peiyinAudio = document.getElementById('peiyinAudio');
    if (peiyinAudio) {
        // 尝试加载音频（不播放）
        try {
            const loadResult = peiyinAudio.load();
            // 检查是否返回Promise
            if (loadResult && typeof loadResult.catch === 'function') {
                loadResult.catch(e => {
                    console.warn('保安音频预加载失败（可能不影响播放）:', e);
                });
            }
        } catch (e) {
            console.warn('保安音频预加载失败（可能不影响播放）:', e);
        }
    }
    
    // 检查是否有需要加载的存档（从start.html传递）
    const loadSaveSlot = sessionStorage.getItem('loadSaveSlot');
    let loadedFromSave = false;
    
    if (loadSaveSlot) {
        // 有存档需要加载
        const slot = parseInt(loadSaveSlot);
        if (loadGameFromSlot(slot)) {
            console.log(`从存档槽位${slot}加载游戏`);
            loadedFromSave = true;
            sessionStorage.removeItem('loadSaveSlot'); // 清除标记
        } else {
            // 加载失败，从头开始
            console.log('存档加载失败，从头开始游戏');
            gameState = new GameState();
        }
    } else {
        // 没有存档，从头开始
        gameState = new GameState();
    }
    
    // 清除失败存档（如果存在）- 注意：这不会清除正常存档
    clearSave();
    
    gameState.updateProgress();
    gameState.updateMapStatus();
    
    // 确保DOM完全加载后再绑定事件
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupEventListeners);
    } else {
        setupEventListeners();
    }
    
    // 如果已加载存档，切换到保存的场景
    if (loadedFromSave) {
        // 从存档加载，直接切换到保存的场景
        console.log('从存档加载，切换到场景:', gameState.currentScene);
        console.log('当前游戏状态:', {
            currentScene: gameState.currentScene,
            solvedPuzzles: gameState.solvedPuzzles,
            unlockedRooms: Array.from(gameState.unlockedRooms),
            room717WindowChecked: gameState.room717WindowChecked,
            vigenereDescClicked: gameState.vigenereDescClicked,
            isFloor2SequenceActive: gameState.isFloor2SequenceActive,
            hasCorrectNursingRecord: gameState.hasCorrectNursingRecord,
            floor2SequenceTriggered: gameState.floor2SequenceTriggered
        });
        
        // 检查是否在2楼特殊流程中（音频播放过程中）保存的
        // 只有在流程进行中且尚未完整触发过的情况下才重新触发
        if (gameState.isFloor2SequenceActive && gameState.hasCorrectNursingRecord && !gameState.floor2SequenceTriggered) {
            // 在音频播放过程中保存的，需要重新触发2楼特殊流程
            console.log('检测到在2楼特殊流程中保存，重新触发流程');
            
            // 先设置场景背景（使用消防通道或走廊场景）
            const sceneContainer = document.getElementById('sceneContainer');
            if (sceneContainer) {
                const corridorScene = gameData.scenes['corridor'];
                if (corridorScene) {
                    sceneContainer.style.backgroundImage = `url('${corridorScene.background}')`;
                }
            }
            
            // 延迟触发2楼特殊流程
            setTimeout(() => {
                // 确保fireExitUsed为true（因为是从消防通道进入的）
                gameState.fireExitUsed = true;
                // 重新触发2楼特殊流程
                handleFloor2SpecialSequence();
            }, 500);
        } else {
            // 正常加载存档，切换到保存的场景
            // 先设置场景背景
            const sceneContainer = document.getElementById('sceneContainer');
            if (sceneContainer) {
                const scene = gameData.scenes[gameState.currentScene];
                if (scene) {
                    sceneContainer.style.backgroundImage = `url('${scene.background}')`;
                    console.log('已设置场景背景:', scene.background);
                }
            }
            
            // 延迟切换场景，确保DOM已加载
            setTimeout(() => {
                console.log('准备切换到场景:', gameState.currentScene);
                console.log('当前解锁的房间:', Array.from(gameState.unlockedRooms));
                console.log('已解决的谜题:', gameState.solvedPuzzles);
                changeScene(gameState.currentScene);
                // 延迟创建observables，确保场景已切换
                setTimeout(() => {
                    // 如果是在2楼场景且已收集到正确护理记录，显示选择按钮
                    if (gameState.currentScene === 'floor_2' && gameState.hasCorrectNursingRecord && gameState.floor2SequenceTriggered) {
                        console.log('加载存档：在2楼选择按钮环节，显示选择按钮');
                        showFloor2ChoiceButtons();
                    } else {
                        createObservables();
                    }
                }, 500);
            }, 200);
        }
    } else {
        // 没有存档，从头开始
        gameState.currentScene = 'corridor';
        
        // 设置场景背景
        const sceneContainer = document.getElementById('sceneContainer');
        if (sceneContainer) {
            const corridorScene = gameData.scenes['corridor'];
            if (corridorScene) {
                sceneContainer.style.backgroundImage = `url('${corridorScene.background}')`;
            }
        }
        
        // 延迟初始化描述文字，确保覆盖任何可能显示的消息
        setTimeout(() => {
            initDescription();
            
            // 确保有"开始调查医院"按钮
            const container = document.getElementById('choicesContainer');
            if (container) {
                container.innerHTML = '';
                const startButton = document.createElement('button');
                startButton.className = 'choice-button w-full p-4 rounded-lg text-left text-lg';
                startButton.textContent = '开始调查医院';
                startButton.onclick = () => startInvestigation();
                container.appendChild(startButton);
            }
            
            // 初始化BGM（从头开始游戏时播放bgm1）
            updateBGMForScene(gameState.currentScene);
        }, 100);
    }
    
    // 如果是从存档加载，也需要初始化BGM
    if (loadedFromSave) {
        // 延迟一点确保场景已切换
        setTimeout(() => {
            updateBGMForScene(gameState.currentScene);
        }, 300);
    }
}

function setupEventListeners() {
    document.getElementById('mapBtn')?.addEventListener('click', showMapModal);
    // 保存按钮 - 弹出选择槽位对话框
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        // 确保移除旧的事件监听器
        saveBtn.onclick = null;
        // 添加新的事件监听器
        saveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const slot = prompt('请选择要保存到的存档槽位（输入1或2）：');
            if (slot === '1' || slot === '2') {
                if (saveGameToSlot(parseInt(slot))) {
                    alert(`游戏已保存到存档槽位${slot}`);
                } else {
                    alert('保存失败');
                }
            } else if (slot !== null) {
                alert('请输入1或2');
            }
        });
        console.log('保存按钮事件监听器已绑定');
    } else {
        console.error('保存按钮不存在！');
    }
    document.getElementById('confirmPuzzle')?.addEventListener('click', confirmPuzzle);
    document.getElementById('cancelPuzzle')?.addEventListener('click', hidePuzzleModal);
    document.getElementById('confirmFloor')?.addEventListener('click', confirmFloor);
    document.getElementById('cancelFloor')?.addEventListener('click', hideFloorMapModal);
    document.getElementById('confirmRoom')?.addEventListener('click', confirmRoom);
    document.getElementById('cancelRoom')?.addEventListener('click', hideRoomSelectionModal);
}

function startInvestigation() {
    // 确保当前场景设置为医院大厅
    if (gameState.currentScene !== 'corridor') {
        gameState.currentScene = 'corridor';
    }
    
    showDescription('你决定深入调查这个神秘的医院。');
    // 清空初始按钮，然后显示场景的 observables
    const container = document.getElementById('choicesContainer');
    if (container) {
        container.innerHTML = '';
    }
    setTimeout(() => createObservables(), 1000);
}

function showMapModal() {
    const modal = document.getElementById('mapModal');
    if (modal) modal.classList.remove('hidden');
}

function closeMapModal() {
    const modal = document.getElementById('mapModal');
    if (modal) modal.classList.add('hidden');
}

// 完整保存游戏状态到指定存档槽位（slot: 1 或 2）
function saveGameToSlot(slot) {
    if (slot !== 1 && slot !== 2) {
        console.error('存档槽位必须是1或2');
        return false;
    }
    
    const saveData = {
        version: '1.0', // 存档版本号
        slot: slot,
        timestamp: new Date().toISOString(),
        // 完整保存所有游戏状态
        currentScene: gameState.currentScene,
        solvedPuzzles: [...gameState.solvedPuzzles], // 复制数组
        unlockedRooms: Array.from(gameState.unlockedRooms), // Set转数组
        gameProgress: { ...gameState.gameProgress }, // 复制对象
        detectionRisk: gameState.detectionRisk,
        room717WindowChecked: gameState.room717WindowChecked,
        vigenereDescClicked: gameState.vigenereDescClicked,
        fireExitUsed: gameState.fireExitUsed,
        operatingRoomNurseSeen: gameState.operatingRoomNurseSeen,
        operatingRoomClueFound: gameState.operatingRoomClueFound,
        operatingRoomClueViewed: gameState.operatingRoomClueViewed,
        operatingRoomClickedAreas: [...gameState.operatingRoomClickedAreas],
        operatingRoomWrongClickedAreas: [...gameState.operatingRoomWrongClickedAreas],
        hasCorrectNursingRecord: gameState.hasCorrectNursingRecord,
        isFloor2SequenceActive: gameState.isFloor2SequenceActive,
        floor2SequenceTriggered: gameState.floor2SequenceTriggered,
        electricBoxChecked: gameState.electricBoxChecked,
        electricBoxWiringFixed: gameState.electricBoxWiringFixed,
        key203Obtained: gameState.key203Obtained,
        hasElevatorCard: gameState.hasElevatorCard,
        isRoom203: gameState.isRoom203,
        room203KeyUsed: gameState.room203KeyUsed,
        room203PatientAwake: gameState.room203PatientAwake,
        room203DialogueStep: gameState.room203DialogueStep,
        basementPasswordEntered: gameState.basementPasswordEntered,
        basementCluesCollected: gameState.basementCluesCollected,
        basementComputerUnlocked: gameState.basementComputerUnlocked,
        isNormalSave: true // 标记这是正常存档
    };
    
    const saveKey = `hospital_mystery_save_slot_${slot}`;
    localStorage.setItem(saveKey, JSON.stringify(saveData));
    console.log(`游戏已保存到存档槽位${slot}`);
    return true;
}

// 从指定存档槽位加载游戏状态
function loadGameFromSlot(slot) {
    if (slot !== 1 && slot !== 2) {
        console.error('存档槽位必须是1或2');
        return false;
    }
    
    try {
        const saveKey = `hospital_mystery_save_slot_${slot}`;
        const saveDataStr = localStorage.getItem(saveKey);
        if (!saveDataStr) {
            console.log(`存档槽位${slot}没有存档`);
            return false;
        }
        
        const saveData = JSON.parse(saveDataStr);
        
        // 检查是否是正常存档
        if (!saveData.isNormalSave) {
            console.log(`存档槽位${slot}不是正常存档格式`);
            return false;
        }
        
        // 恢复所有游戏状态
        gameState.currentScene = saveData.currentScene || 'corridor';
        gameState.solvedPuzzles = saveData.solvedPuzzles || [];
        gameState.unlockedRooms = new Set(saveData.unlockedRooms || ['corridor']);
        gameState.gameProgress = saveData.gameProgress || {
            puzzlesSolved: 0,
            totalPuzzles: 7
        };
        gameState.detectionRisk = saveData.detectionRisk || 0;
        gameState.room717WindowChecked = saveData.room717WindowChecked || false;
        gameState.vigenereDescClicked = saveData.vigenereDescClicked || false;
        gameState.fireExitUsed = saveData.fireExitUsed || false;
        gameState.operatingRoomNurseSeen = saveData.operatingRoomNurseSeen || false;
        gameState.operatingRoomClueFound = saveData.operatingRoomClueFound || false;
        gameState.operatingRoomClueViewed = saveData.operatingRoomClueViewed || false;
        gameState.operatingRoomClickedAreas = saveData.operatingRoomClickedAreas || [];
        gameState.operatingRoomWrongClickedAreas = saveData.operatingRoomWrongClickedAreas || [];
        gameState.hasCorrectNursingRecord = saveData.hasCorrectNursingRecord || false;
        gameState.isFloor2SequenceActive = saveData.isFloor2SequenceActive || false;
        gameState.floor2SequenceTriggered = saveData.floor2SequenceTriggered || false;
        gameState.electricBoxChecked = saveData.electricBoxChecked || false;
        gameState.electricBoxWiringFixed = saveData.electricBoxWiringFixed || false;
        gameState.key203Obtained = saveData.key203Obtained || false;
        gameState.hasElevatorCard = saveData.hasElevatorCard || false;
        gameState.isRoom203 = saveData.isRoom203 || false;
        gameState.room203KeyUsed = saveData.room203KeyUsed || false;
        gameState.room203PatientAwake = saveData.room203PatientAwake || false;
        gameState.room203DialogueStep = saveData.room203DialogueStep || 0;
        gameState.basementPasswordEntered = saveData.basementPasswordEntered || false;
        gameState.basementCluesCollected = saveData.basementCluesCollected || [];
        gameState.basementComputerUnlocked = saveData.basementComputerUnlocked || false;
        
        console.log(`从存档槽位${slot}加载游戏成功`);
        console.log('加载的游戏状态:', {
            currentScene: gameState.currentScene,
            solvedPuzzles: gameState.solvedPuzzles,
            unlockedRooms: Array.from(gameState.unlockedRooms),
            room717WindowChecked: gameState.room717WindowChecked,
            vigenereDescClicked: gameState.vigenereDescClicked,
            floor2SequenceTriggered: gameState.floor2SequenceTriggered,
            hasCorrectNursingRecord: gameState.hasCorrectNursingRecord,
            key203Obtained: gameState.key203Obtained,
            hasElevatorCard: gameState.hasElevatorCard,
            basementPasswordEntered: gameState.basementPasswordEntered
        });
        return true;
    } catch (e) {
        console.error('加载存档失败:', e);
        return false;
    }
}

// 获取存档信息（用于显示在界面上）
function getSaveSlotInfo(slot) {
    if (slot !== 1 && slot !== 2) return null;
    
    try {
        const saveKey = `hospital_mystery_save_slot_${slot}`;
        const saveDataStr = localStorage.getItem(saveKey);
        if (!saveDataStr) return null;
        
        const saveData = JSON.parse(saveDataStr);
        if (!saveData.isNormalSave) return null;
        
        return {
            exists: true,
            timestamp: saveData.timestamp,
            currentScene: saveData.currentScene,
            solvedPuzzles: saveData.solvedPuzzles?.length || 0,
            date: new Date(saveData.timestamp).toLocaleString('zh-CN')
        };
    } catch (e) {
        return null;
    }
}

// 删除指定存档槽位
function deleteSaveSlot(slot) {
    if (slot !== 1 && slot !== 2) return false;
    const saveKey = `hospital_mystery_save_slot_${slot}`;
    localStorage.removeItem(saveKey);
    console.log(`存档槽位${slot}已删除`);
    return true;
}

// 保存游戏（仅用于失败时保存，正常退出不会保存）
function saveGameForFailure() {
    // 将游戏状态转换为可序列化的格式，标记为失败存档
    // 如果是从手术室场景失败的，重置手术室收集信息的状态（保留护士动画状态）
    let operatingRoomClueFound = gameState.operatingRoomClueFound;
    let operatingRoomClueViewed = gameState.operatingRoomClueViewed;
    let operatingRoomClickedAreas = gameState.operatingRoomClickedAreas;
    let operatingRoomWrongClickedAreas = gameState.operatingRoomWrongClickedAreas;
    let hasCorrectNursingRecord = gameState.hasCorrectNursingRecord;
    
    // 如果当前场景是手术室，重置收集信息的状态
    if (gameState.currentScene === 'operating') {
        operatingRoomClueFound = false;
        operatingRoomClueViewed = false;
        operatingRoomClickedAreas = [];
        operatingRoomWrongClickedAreas = [];
        hasCorrectNursingRecord = false;
    }
    
    const saveData = {
        currentScene: gameState.currentScene,
        solvedPuzzles: gameState.solvedPuzzles,
        unlockedRooms: Array.from(gameState.unlockedRooms), // 将Set转换为数组
        gameProgress: gameState.gameProgress,
        detectionRisk: gameState.detectionRisk,
        room717WindowChecked: gameState.room717WindowChecked,
        vigenereDescClicked: gameState.vigenereDescClicked,
        fireExitUsed: gameState.fireExitUsed,
        operatingRoomNurseSeen: gameState.operatingRoomNurseSeen,
        operatingRoomClueFound: operatingRoomClueFound,
        operatingRoomClueViewed: operatingRoomClueViewed,
        operatingRoomClickedAreas: operatingRoomClickedAreas,
        operatingRoomWrongClickedAreas: operatingRoomWrongClickedAreas,
        hasCorrectNursingRecord: hasCorrectNursingRecord,
        isFloor2SequenceActive: gameState.isFloor2SequenceActive, // 保存2楼特殊流程状态
        floor2SequenceTriggered: gameState.floor2SequenceTriggered,
        electricBoxChecked: gameState.electricBoxChecked,
        electricBoxWiringFixed: gameState.electricBoxWiringFixed,
        key203Obtained: gameState.key203Obtained,
        hasElevatorCard: gameState.hasElevatorCard,
        isRoom203: gameState.isRoom203,
        room203KeyUsed: gameState.room203KeyUsed,
        room203PatientAwake: gameState.room203PatientAwake,
        room203DialogueStep: gameState.room203DialogueStep,
        basementPasswordEntered: gameState.basementPasswordEntered,
        basementCluesCollected: gameState.basementCluesCollected,
        basementComputerUnlocked: gameState.basementComputerUnlocked,
        isFailureSave: true, // 标记这是失败存档
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('hospital_mystery_save', JSON.stringify(saveData));
    console.log('失败存档已保存，可以从当前场景继续游戏');
}

// 清除存档
function clearSave() {
    localStorage.removeItem('hospital_mystery_save');
    console.log('存档已清除');
}

// 加载游戏存档（仅加载失败存档）
function loadGame() {
    try {
        const saveDataStr = localStorage.getItem('hospital_mystery_save');
        if (!saveDataStr) return false;
        
        const saveData = JSON.parse(saveDataStr);
        
        // 只加载失败存档，如果是普通存档（没有isFailureSave标记），清除它
        if (!saveData.isFailureSave) {
            console.log('检测到旧格式存档（非失败存档），清除它');
            clearSave();
            return false;
        }
        
        // 恢复游戏状态
        gameState.currentScene = saveData.currentScene || 'corridor';
        gameState.solvedPuzzles = saveData.solvedPuzzles || [];
        gameState.unlockedRooms = new Set(saveData.unlockedRooms || ['corridor']); // 将数组转换回Set
        gameState.gameProgress = saveData.gameProgress || {
            puzzlesSolved: 0,
            totalPuzzles: 7
        };
        gameState.detectionRisk = saveData.detectionRisk || 0;
        gameState.room717WindowChecked = saveData.room717WindowChecked || false;
        gameState.vigenereDescClicked = saveData.vigenereDescClicked || false;
        gameState.fireExitUsed = saveData.fireExitUsed || false;
        gameState.operatingRoomNurseSeen = saveData.operatingRoomNurseSeen || false;
        gameState.operatingRoomClueFound = saveData.operatingRoomClueFound || false;
        gameState.operatingRoomClueViewed = saveData.operatingRoomClueViewed || false;
        gameState.operatingRoomClickedAreas = saveData.operatingRoomClickedAreas || [];
        gameState.operatingRoomWrongClickedAreas = saveData.operatingRoomWrongClickedAreas || [];
        gameState.hasCorrectNursingRecord = saveData.hasCorrectNursingRecord || false;
        gameState.isFloor2SequenceActive = saveData.isFloor2SequenceActive || false;
        gameState.floor2SequenceTriggered = saveData.floor2SequenceTriggered || false;
        gameState.electricBoxChecked = saveData.electricBoxChecked || false;
        gameState.electricBoxWiringFixed = saveData.electricBoxWiringFixed || false;
        gameState.key203Obtained = saveData.key203Obtained || false;
        gameState.hasElevatorCard = saveData.hasElevatorCard || false;
        gameState.isRoom203 = saveData.isRoom203 || false;
        gameState.room203KeyUsed = saveData.room203KeyUsed || false;
        gameState.room203PatientAwake = saveData.room203PatientAwake || false;
        gameState.room203DialogueStep = saveData.room203DialogueStep || 0;
        gameState.basementPasswordEntered = saveData.basementPasswordEntered || false;
        gameState.basementCluesCollected = saveData.basementCluesCollected || [];
        gameState.basementComputerUnlocked = saveData.basementComputerUnlocked || false;
        
        console.log('失败存档已加载，可以从', gameState.currentScene, '继续游戏');
        console.log('失败存档状态:', {
            isFloor2SequenceActive: gameState.isFloor2SequenceActive,
            hasCorrectNursingRecord: gameState.hasCorrectNursingRecord
        });
        return true;
    } catch (e) {
        console.error('加载存档失败:', e);
        clearSave(); // 如果加载失败，清除损坏的存档
        return false;
    }
}

function changeScene(sceneId) {
    const scene = gameData.scenes[sceneId];
    if (!scene) return;
    
    // 检查是否锁定（但如果场景已解锁，则允许进入）
    // 医院大厅场景（corridor）始终可以进入，不显示锁定消息
    // 如果场景已经在unlockedRooms中，也允许进入（例如通过剧情推进解锁的）
    if (sceneId !== 'corridor' && scene.locked && scene.requiredPuzzle && 
        !gameState.solvedPuzzles.includes(scene.requiredPuzzle) && 
        !gameState.unlockedRooms.has(sceneId)) {
        showDescription('这个区域还未解锁。');
        return;
    }
    
    gameState.currentScene = sceneId;
    // 不再自动保存（只在失败时保存）
    
    const sceneContainer = document.getElementById('sceneContainer');
    if (sceneContainer) sceneContainer.style.backgroundImage = `url('${scene.background}')`;
    
    // 更新BGM（根据场景切换）
    updateBGMForScene(sceneId);
    
    // 清除所有热点
    clearHotspots();
    
    clearObservables();
    
    // 如果是717房间，创建可点击区域
    if (sceneId === 'room_717') {
        // 检查是否应该作为203病房（如果已经获得203钥匙且未使用过，或者已经使用过钥匙）
        // 或者如果已经设置了isRoom203标记
        const shouldBeRoom203 = gameState.isRoom203 || 
                                (gameState.key203Obtained && !gameState.room203KeyUsed) ||
                                gameState.room203KeyUsed;
        
        if (shouldBeRoom203) {
            // 确保isRoom203标记被设置
            if (!gameState.isRoom203) {
                gameState.isRoom203 = true;
                console.log('自动设置isRoom203 = true（检测到203病房条件）');
            }
            // 作为203病房，显示不同的描述
            console.log('切换到203病房（复用room_717场景）');
            // 如果已经使用过钥匙，创建配药热点
            if (gameState.room203KeyUsed) {
                setTimeout(() => {
                    createRoom203MedicineHotspot();
                    createObservables();
                }, 500);
            } else {
                // 未使用钥匙，只创建observables（会显示"使用203钥匙"按钮）
                console.log('203病房：未使用钥匙，准备创建observables，key203Obtained =', gameState.key203Obtained, 'isRoom203 =', gameState.isRoom203);
                setTimeout(() => {
                    createObservables();
                }, 500);
            }
        } else {
            // 作为717房间，使用原有逻辑
            console.log('切换到717房间，准备创建热点...');
            console.log('当前状态 - room717WindowChecked:', gameState.room717WindowChecked);
            
            // 检查状态是否合理：如果标记为已检查，但没有完成维吉尼亚密码，可能是错误状态，重置它
            // 这样可以确保即使存档状态错误，用户也能重新点击窗户
            console.log('状态检查：');
            console.log('  - room717WindowChecked:', gameState.room717WindowChecked);
            console.log('  - 已解决的谜题列表:', gameState.solvedPuzzles);
            console.log('  - 是否包含vigenere:', gameState.solvedPuzzles.includes('vigenere'));
            
            if (gameState.room717WindowChecked && !gameState.solvedPuzzles.includes('vigenere')) {
                console.log('⚠️ 检测到不一致状态：标记为已检查窗户但未完成维吉尼亚密码，重置状态');
                gameState.room717WindowChecked = false;
                // 不再自动保存（只在失败时保存）
                console.log('✓ 状态已重置为 false');
            } else if (gameState.room717WindowChecked && gameState.solvedPuzzles.includes('vigenere')) {
                console.log('✓ 状态正常：已检查窗户且已完成维吉尼亚密码，这是正确的状态');
            }
            
            setTimeout(() => {
                // 确保容器存在后再创建热点
                const container = document.getElementById('hotspotsContainer');
                const sceneContainer = document.getElementById('sceneContainer');
                
                console.log('延迟500ms后检查：');
                console.log('  - hotspotsContainer 存在:', !!container);
                console.log('  - sceneContainer 存在:', !!sceneContainer);
                console.log('  - 重置后的状态 - room717WindowChecked:', gameState.room717WindowChecked);
                
                if (container) {
                    console.log('  - 容器内容（创建前）:', container.innerHTML.length, '字符');
                    // 现在创建热点（状态应该已经修正）
                    createRoom717Hotspots();
                    console.log('  - 容器内容（创建后）:', container.innerHTML.length, '字符');
                    console.log('  - 容器子元素数量:', container.children.length);
                } else {
                    console.error('错误：hotspotsContainer 容器不存在！无法创建717房间热点！');
                }
                createObservables();
            }, 500);
        }
    } else if (sceneId === 'operating' && gameState.fireExitUsed && !gameState.operatingRoomNurseSeen) {
        // 从消防通道进入手术室，显示护士被惊吓的动画
        setTimeout(() => {
            showNurseAnimation();
        }, 500);
    } else if (sceneId === 'operating' && gameState.fireExitUsed && gameState.operatingRoomNurseSeen && !gameState.operatingRoomClueFound) {
        // 已经看过动画，但还没找到线索，显示可点击区域
        setTimeout(() => {
            createOperatingRoomHotspots();
            createObservables();
        }, 500);
    } else if (sceneId === 'archive') {
        // 三楼电工房场景，创建电箱热点
        setTimeout(() => {
            createElectricBoxHotspot();
            createObservables();
        }, 500);
    } else if (sceneId === 'underground_elevator') {
        // 地下电梯场景
        if (gameState.basementPasswordEntered) {
            // 已经输入密码，显示地下室状态
            setTimeout(() => {
                showBasementDescription();
            }, 500);
        } else {
            // 还未输入密码，正常显示场景
            setTimeout(() => createObservables(), 500);
        }
    } else {
        setTimeout(() => createObservables(), 500);
    }
    
    // 如果是走廊场景且已查看过护理记录，不显示默认描述（描述会在createObservables中显示）
    // 如果是手术室场景且通过消防通道进入，不显示默认描述（描述会在showNurseAnimation中显示）
    // 如果是2楼场景且已经显示了"躲在消防通道听到保安渐渐走远了"，不显示默认描述
    if ((sceneId === 'corridor' && gameState.operatingRoomClueViewed) || 
        (sceneId === 'operating' && gameState.fireExitUsed) ||
        (sceneId === 'floor_2' && gameState.hasCorrectNursingRecord)) {
        // 不显示默认描述，等待动态显示
    } else if (scene.description) {
        // 如果是room_717场景且是203病房，显示不同的描述
        if (sceneId === 'room_717' && gameState.isRoom203) {
            if (gameState.room203KeyUsed) {
                // 已经使用过钥匙，显示进入房间后的描述
                showDescription('推开203的门，里面有个人穿着约束衣被固定在床上。他一直在挣扎，嘴里喊着意义不明的话。');
            } else {
                // 未使用钥匙，显示门口的描述
                const descriptionText = '来到203病房门口，呼喊声是从里面传来的。';
                showDescription(descriptionText);
                // 文字描述完成后显示"使用203钥匙"按钮（如果已获得钥匙）
                // 计算打字机效果完成时间：文字长度 * 50ms + 200ms缓冲
                const typingDuration = descriptionText.length * 50 + 200;
                setTimeout(() => {
                    // 检查是否已获得钥匙且未使用过
                    if (gameState.key203Obtained && !gameState.room203KeyUsed) {
                        console.log('文字描述完成，显示"使用203钥匙"按钮');
                        const container = document.getElementById('choicesContainer');
                        if (container) {
                            // 清除现有按钮
                            container.innerHTML = '';
                            const useKeyButton = document.createElement('button');
                            useKeyButton.className = 'choice-button w-full p-3 rounded-lg text-left mb-2';
                            useKeyButton.textContent = '使用203钥匙';
                            useKeyButton.onclick = () => {
                                handleUseRoom203Key();
                            };
                            container.appendChild(useKeyButton);
                        }
                    }
                }, typingDuration);
            }
        } else {
            // 只有当描述不为空时才显示
            showDescription(scene.description);
        }
    }
}

function createObservables() {
    console.log('createObservables被调用，currentScene =', gameState.currentScene);
    const scene = gameData.scenes[gameState.currentScene];
    if (!scene) {
        console.log('场景不存在，返回');
        return;
    }
    
    // 如果正在执行2楼特殊流程，不创建observables，防止显示按钮
    if (gameState.isFloor2SequenceActive) {
        console.log('2楼特殊流程进行中，不创建observables');
        return;
    }
    
    // 如果是2楼场景且已经显示了选择按钮，不显示默认的observables
    if (gameState.currentScene === 'floor_2') {
        const container = document.getElementById('choicesContainer');
        if (container) {
            const existingButtons = container.querySelectorAll('button');
            // 如果已经有203或三楼电工房按钮，不显示默认的observables
            if (existingButtons.length > 0) {
                const buttonTexts = Array.from(existingButtons).map(btn => btn.textContent);
                if (buttonTexts.includes('203') || buttonTexts.includes('三楼电工房')) {
                    return; // 已经显示了选择按钮，不显示默认的observables
                }
            }
        }
    }
    
    const container = document.getElementById('choicesContainer');
    if (!container) return;
    container.innerHTML = '';
    
    // 如果是走廊场景且已查看过护理记录，只显示消防通道按钮
    // 注意：如果是从leaveOperatingRoom()进入的，描述和按钮已经在那里显示了，这里直接返回
    // 如果是从其他地方进入（比如刷新页面），则显示按钮但不重复显示描述
    if (gameState.currentScene === 'corridor' && gameState.operatingRoomClueViewed) {
        // 检查是否已经有消防通道按钮，如果没有则添加
        const existingButton = container.querySelector('button');
        if (!existingButton || existingButton.textContent !== '消防通道') {
            const fireExitButton = document.createElement('button');
            fireExitButton.className = 'choice-button w-full p-4 rounded-lg text-left text-lg mb-2';
            fireExitButton.textContent = '消防通道';
            fireExitButton.onclick = () => {
                showFireExitFloorModal();
            };
            container.appendChild(fireExitButton);
            
            // 如果描述不是提示文字，则更新（比如刷新页面时）
            // 需要等待打字机效果完成后再检查，避免在打字过程中重复显示
            setTimeout(() => {
                const descEl = document.getElementById('descriptionText');
                if (descEl) {
                    const currentText = descEl.textContent.trim();
                    // 只有当描述完全不是提示文字时才更新（避免在打字过程中重复）
                    if (currentText && !currentText.includes('现在线索指向2楼') && currentText.length > 0) {
                        showDescription('现在线索指向2楼，但该去哪个房间呢？');
                    } else if (!currentText) {
                        // 如果描述为空，显示提示文字
                        showDescription('现在线索指向2楼，但该去哪个房间呢？');
                    }
                }
            }, 100);
        }
        return; // 只显示消防通道按钮，不显示其他observables
    }
    
    // 如果是717房间且已经检查过窗户
    if (gameState.currentScene === 'room_717' && gameState.room717WindowChecked) {
        // 如果已经完成维吉尼亚密码解谜且未使用过消防通道，显示消防通道按钮
        if (gameState.solvedPuzzles.includes('vigenere') && !gameState.fireExitUsed) {
            const fireExitButton = document.createElement('button');
            fireExitButton.className = 'choice-button w-full p-3 rounded-lg text-left mb-2';
            fireExitButton.textContent = '消防通道';
            fireExitButton.onclick = () => {
                showFireExitFloorModal();
            };
            container.appendChild(fireExitButton);
        } else if (!gameState.solvedPuzzles.includes('vigenere')) {
            // 未完成解谜，显示纸条按钮
            const noteButton = document.createElement('button');
            noteButton.className = 'choice-button w-full p-3 rounded-lg text-left mb-2';
            noteButton.textContent = '纸条';
            noteButton.onclick = () => {
                showPuzzleModal('vigenere');
            };
            container.appendChild(noteButton);
        }
        return;
    }
    
    // 如果是手术室场景且从消防通道进入
    if (gameState.currentScene === 'operating' && gameState.fireExitUsed) {
        if (!gameState.operatingRoomClueFound) {
            // 还没找到线索，热点已经在 changeScene 中创建，这里不需要显示 observables
            return;
        } else if (gameState.operatingRoomClueFound) {
            // 已经找到线索，显示查看护理记录按钮
            const clueButton = document.createElement('button');
            clueButton.className = 'choice-button w-full p-3 rounded-lg text-left mb-2';
            clueButton.textContent = '查看护理记录';
            clueButton.onclick = () => {
                showNursingRecordModal();
            };
            container.appendChild(clueButton);
            // 继续显示场景的 observables（如果有）
        }
    }
    
    // 如果是203病房（复用room_717场景），需要特殊处理
    // 检查条件：当前场景是room_717，且（isRoom203为true，或者已获得203钥匙）
    const isRoom203Scene = gameState.currentScene === 'room_717' && 
                          (gameState.isRoom203 || gameState.key203Obtained);
    
    console.log('检查203病房条件:', {
        currentScene: gameState.currentScene,
        isRoom203: gameState.isRoom203,
        key203Obtained: gameState.key203Obtained,
        isRoom203Scene: isRoom203Scene,
        containerExists: !!container
    });
    
    if (isRoom203Scene) {
        // 确保isRoom203标记被设置
        if (!gameState.isRoom203) {
            gameState.isRoom203 = true;
            console.log('在createObservables中自动设置isRoom203 = true');
        }
        console.log('检测到203病房，检查状态:', {
            room203KeyUsed: gameState.room203KeyUsed,
            key203Obtained: gameState.key203Obtained,
            isRoom203: gameState.isRoom203,
            currentScene: gameState.currentScene
        });
        // 如果已经使用过钥匙，不显示按钮（已经进入房间）
        if (!gameState.room203KeyUsed) {
            // 未使用钥匙，检查是否已获得钥匙
            if (gameState.key203Obtained) {
                // 检查是否已经有"使用203钥匙"按钮，避免重复创建
                const existingButton = container.querySelector('button');
                if (!existingButton || existingButton.textContent !== '使用203钥匙') {
                    console.log('创建"使用203钥匙"按钮');
                    const useKeyButton = document.createElement('button');
                    useKeyButton.className = 'choice-button w-full p-3 rounded-lg text-left mb-2';
                    useKeyButton.textContent = '使用203钥匙';
                    useKeyButton.onclick = () => {
                        handleUseRoom203Key();
                    };
                    container.appendChild(useKeyButton);
                } else {
                    console.log('"使用203钥匙"按钮已存在，不重复创建');
                }
            } else {
                console.log('未获得203钥匙，不显示按钮');
            }
        } else {
            console.log('已经使用过203钥匙，不显示按钮');
        }
        return;
    }
    
    // 如果是三楼电工房场景，需要特殊处理按钮显示
    if (gameState.currentScene === 'archive') {
        // 如果已经获得了203钥匙，不显示"203钥匙"按钮，显示"消防通道"按钮
        if (gameState.key203Obtained) {
            const fireExitButton = document.createElement('button');
            fireExitButton.className = 'choice-button w-full p-3 rounded-lg text-left mb-2';
            fireExitButton.textContent = '消防通道';
            fireExitButton.onclick = () => {
                showFireExitFloorModal();
            };
            container.appendChild(fireExitButton);
        } else {
            // 显示场景的observables（包括"203钥匙"按钮）
            if (scene.observables && scene.observables.length > 0) {
                scene.observables.forEach(obs => {
                    // 只显示"203钥匙"按钮，不显示"揭露真相"按钮（需要完成更多谜题）
                    if (obs.id === 'key_203') {
                        const button = document.createElement('button');
                        button.className = 'choice-button w-full p-3 rounded-lg text-left mb-2';
                        button.textContent = obs.name;
                        button.onclick = obs.action;
                        container.appendChild(button);
                    } else if (obs.id === 'final' && gameState.solvedPuzzles.length >= 7) {
                        // 只有完成7个谜题后才显示"揭露真相"按钮
                        const button = document.createElement('button');
                        button.className = 'choice-button w-full p-3 rounded-lg text-left mb-2';
                        button.textContent = obs.name;
                        button.onclick = obs.action;
                        container.appendChild(button);
                    }
                });
            }
        }
    } else {
        // 其他场景正常显示observables
        if (scene.observables && scene.observables.length > 0) {
            scene.observables.forEach(obs => {
                // 如果是地下电梯场景且已经输入密码，不显示"输入密码"按钮
                if (gameState.currentScene === 'underground_elevator' && 
                    obs.id === 'enter_password' && 
                    gameState.basementPasswordEntered) {
                    return; // 跳过"输入密码"按钮
                }
                const button = document.createElement('button');
                button.className = 'choice-button w-full p-3 rounded-lg text-left mb-2';
                button.textContent = obs.name;
                button.onclick = obs.action;
                container.appendChild(button);
            });
        }
    }
}

function clearObservables() {
    const container = document.getElementById('choicesContainer');
    if (container) container.innerHTML = '';
}

// 禁用所有按钮交互
function disableAllButtons() {
    const container = document.getElementById('choicesContainer');
    if (container) {
        const buttons = container.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.pointerEvents = 'none';
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
            button.disabled = true;
        });
    }
}

// 启用所有按钮交互
function enableAllButtons() {
    const container = document.getElementById('choicesContainer');
    if (container) {
        const buttons = container.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.pointerEvents = 'auto';
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
            button.disabled = false;
        });
    }
}

// 清除热点
function clearHotspots() {
    const container = document.getElementById('hotspotsContainer');
    if (container) container.innerHTML = '';
}

// 为717房间创建可点击热点
function createRoom717Hotspots() {
    const container = document.getElementById('hotspotsContainer');
    if (!container) {
        console.error('717房间：hotspotsContainer 容器不存在！');
        return;
    }
    
    // 调试：检查状态
    console.log('717房间热点创建检查 - room717WindowChecked:', gameState.room717WindowChecked);
    console.log('717房间热点创建检查 - 容器存在:', !!container);
    
    // 如果还没有检查过窗户，显示可点击区域（右侧窗户位置）
    if (!gameState.room717WindowChecked) {
        // 先清除可能存在的旧热点
        const existingHotspot = container.querySelector('[data-room717-window]');
        if (existingHotspot) {
            existingHotspot.remove();
        }
        
        const windowHotspot = document.createElement('div');
        windowHotspot.className = 'absolute cursor-pointer transition-all duration-300';
        windowHotspot.dataset.room717Window = 'true';
        // 位置在右侧，适当缩小尺寸
        windowHotspot.style.position = 'absolute'; // 明确设置定位
        windowHotspot.style.right = '0%';
        windowHotspot.style.top = '20%';
        windowHotspot.style.width = '18%'; // 缩小宽度从25%到18%
        windowHotspot.style.height = '50%'; // 缩小高度从60%到50%
        windowHotspot.style.opacity = '0';
        windowHotspot.style.zIndex = '1000'; // 提高z-index确保在最上层
        windowHotspot.style.pointerEvents = 'auto'; // 确保可以点击
        windowHotspot.title = '检查窗户';
        
        // 鼠标悬停时显示提示（透明无色）
        windowHotspot.addEventListener('mouseenter', () => {
            windowHotspot.style.opacity = '0.15';
            windowHotspot.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        });
        
        windowHotspot.addEventListener('mouseleave', () => {
            windowHotspot.style.opacity = '0';
            windowHotspot.style.backgroundColor = 'transparent';
        });
        
        windowHotspot.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('717房间窗户被点击！');
            handleRoom717WindowClick();
        });
        
        container.appendChild(windowHotspot);
        
        // 热点已创建（透明无色，宽度18%，高度50%）
    } else {
        console.log('717房间：窗户已检查过，不显示热点');
    }
}

// 处理717房间窗户点击
function handleRoom717WindowClick() {
    if (gameState.room717WindowChecked) return;
    
    gameState.room717WindowChecked = true;
    
    // 显示描述文字
    showDescription('你走到窗边，发现窗户破了，但房间里没有玻璃碎片。咦，旁边有张纸条。');
    
    // 清除热点
    clearHotspots();
    
    // 显示纸条按钮
    setTimeout(() => {
        const container = document.getElementById('choicesContainer');
        if (container) {
            const noteButton = document.createElement('button');
            noteButton.className = 'choice-button w-full p-3 rounded-lg text-left mb-2';
            noteButton.textContent = '纸条';
            noteButton.onclick = () => {
                showPuzzleModal('vigenere');
            };
            container.appendChild(noteButton);
        }
    }, 2000); // 等待描述文字显示完成后再显示按钮
}

// 存储当前的打字机效果定时器，以便可以清除
let currentTypingInterval = null;

function showDescription(text) {
    const descEl = document.getElementById('descriptionText');
    if (descEl) {
        // 清除之前的打字机效果（如果存在）
        if (currentTypingInterval) {
            clearInterval(currentTypingInterval);
            currentTypingInterval = null;
        }
        
        // 立即清除文字内容，避免叠加
        descEl.textContent = '';
        
        let index = 0;
        currentTypingInterval = setInterval(() => {
            if (index < text.length) {
                descEl.textContent += text[index++];
            } else {
                clearInterval(currentTypingInterval);
                currentTypingInterval = null;
            }
        }, 50); // 减慢打字机速度：从30ms改为50ms，让玩家有时间看完描述
    }
}

// 初始化描述文字（确保显示初始界面内容）
function initDescription() {
    const descEl = document.getElementById('descriptionText');
    if (descEl) {
        descEl.textContent = '你来到了位于城郊的医院。';
    }
}

// 显示手术室护士被惊吓离开的动画
function showNurseAnimation() {
    const container = document.getElementById('sceneContainer');
    if (!container) return;
    
    // 标记已看过动画
    gameState.operatingRoomNurseSeen = true;
    
    // 创建人形黑影元素（使用代码绘制，不使用图片）
    const nurseElement = document.createElement('div');
    nurseElement.id = 'scaredNurse';
    nurseElement.style.position = 'absolute';
    nurseElement.style.left = '75%'; // 从消防通道位置（右侧）
    nurseElement.style.top = '30%';
    nurseElement.style.width = '80px';
    nurseElement.style.height = '160px';
    nurseElement.style.zIndex = '10';
    nurseElement.style.opacity = '0';
    nurseElement.style.transition = 'all 0.6s ease-out';
    
    // 使用SVG绘制人形黑影
    nurseElement.innerHTML = `
        <svg width="80" height="160" viewBox="0 0 80 160" xmlns="http://www.w3.org/2000/svg">
            <!-- 头部（圆形） -->
            <circle cx="40" cy="20" r="15" fill="#000000" opacity="0.8"/>
            <!-- 身体（矩形） -->
            <rect x="25" y="35" width="30" height="60" rx="5" fill="#000000" opacity="0.8"/>
            <!-- 左臂 -->
            <rect x="10" y="40" width="15" height="40" rx="7" fill="#000000" opacity="0.8"/>
            <!-- 右臂 -->
            <rect x="55" y="40" width="15" height="40" rx="7" fill="#000000" opacity="0.8"/>
            <!-- 左腿 -->
            <rect x="20" y="95" width="12" height="50" rx="6" fill="#000000" opacity="0.8"/>
            <!-- 右腿 -->
            <rect x="48" y="95" width="12" height="50" rx="6" fill="#000000" opacity="0.8"/>
        </svg>
    `;
    
    container.appendChild(nurseElement);
    
    // 显示描述文字（只显示一次，不删除再显示）
    showDescription('你从消防通道出来，远远看到一个负责打扫的护士，她像是受到了惊吓，快速离开了。你上前观察，发现手术室很凌乱，匆忙离开的护士好像留下了什么。');
    
    // 延迟后显示护士（从右侧出现）
    setTimeout(() => {
        nurseElement.style.opacity = '1';
        
        // 护士快速向左移动并消失
        setTimeout(() => {
            nurseElement.style.left = '-10%';
            nurseElement.style.opacity = '0';
            
            // 动画结束后移除元素
            setTimeout(() => {
                nurseElement.remove();
            }, 600);
        }, 600);
    }, 2000); // 等待描述文字显示一段时间后再显示黑影
    
    // 描述文字显示几秒后消失
    setTimeout(() => {
        const descEl = document.getElementById('descriptionText');
        if (descEl) {
            descEl.style.transition = 'opacity 1s ease-out';
            descEl.style.opacity = '0';
            setTimeout(() => {
                descEl.textContent = '';
                descEl.style.opacity = '1';
                descEl.style.transition = '';
                // 显示可点击区域
                createOperatingRoomHotspots();
                createObservables();
            }, 1000);
        }
    }, 5000); // 5秒后消失
}

// 创建手术室的可点击热点区域（类似717房间）
function createOperatingRoomHotspots() {
    const container = document.getElementById('hotspotsContainer');
    if (!container) return;
    
    // 如果已经找到线索，不再显示热点
    if (gameState.operatingRoomClueFound) return;
    
    // 定义5个可点击区域（其中3个是正确的，需要按顺序点击）
    const clickableAreas = [
        { id: 'area1', x: 2, y: 40, width: 10, height: 15, isCorrect: true, order: 1 }, // 手术台下方
        { id: 'area2', x: 45, y: 65, width: 10, height: 10, isCorrect: false }, // 错误的区域
        { id: 'area3', x: 72, y: 45, width: 10, height: 12, isCorrect: true, order: 2 }, // 器械台
        { id: 'area4', x: 35, y: 75, width: 8, height: 10, isCorrect: false }, // 错误的区域
        { id: 'area5', x: 85, y: 75, width: 12, height: 15, isCorrect: true, order: 3 } // 角落的垃圾桶
    ];
    
    clickableAreas.forEach(area => {
        const hotspot = document.createElement('div');
        hotspot.className = 'absolute cursor-pointer transition-all duration-300';
        hotspot.style.left = `${area.x}%`;
        hotspot.style.top = `${area.y}%`;
        hotspot.style.width = `${area.width}%`;
        hotspot.style.height = `${area.height}%`;
        hotspot.style.opacity = '0';
        hotspot.dataset.areaId = area.id;
        hotspot.dataset.isCorrect = area.isCorrect;
        hotspot.dataset.order = area.order || 0;
        
        // 鼠标悬停效果
        hotspot.addEventListener('mouseenter', () => {
            hotspot.style.opacity = '0.2';
            hotspot.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            hotspot.style.border = '2px dashed rgba(255, 255, 255, 0.5)';
        });
        
        hotspot.addEventListener('mouseleave', () => {
            // 如果已经点击过且是正确的，保持半透明状态
            if (gameState.operatingRoomClickedAreas.includes(area.id) && area.isCorrect) {
                hotspot.style.opacity = '0.15';
                hotspot.style.backgroundColor = 'rgba(100, 200, 255, 0.3)';
            } else if (gameState.operatingRoomWrongClickedAreas.includes(area.id) && !area.isCorrect) {
                // 如果已经点击过且是错误的，保持半透明状态（红色）
                hotspot.style.opacity = '0.15';
                hotspot.style.backgroundColor = 'rgba(200, 100, 100, 0.3)';
            } else {
                hotspot.style.opacity = '0';
                hotspot.style.backgroundColor = 'transparent';
            }
            hotspot.style.border = 'none';
        });
        
        hotspot.addEventListener('click', () => {
            handleOperatingRoomAreaClick(area);
        });
        
        container.appendChild(hotspot);
    });
    
    // 更新已点击区域的显示状态
    clickableAreas.forEach(area => {
        if (gameState.operatingRoomClickedAreas.includes(area.id) && area.isCorrect) {
            const hotspot = container.querySelector(`[data-area-id="${area.id}"]`);
            if (hotspot) {
                hotspot.style.opacity = '0.15';
                hotspot.style.backgroundColor = 'rgba(100, 200, 255, 0.3)';
            }
        } else if (gameState.operatingRoomWrongClickedAreas.includes(area.id) && !area.isCorrect) {
            // 显示已点击的错误区域（红色）
            const hotspot = container.querySelector(`[data-area-id="${area.id}"]`);
            if (hotspot) {
                hotspot.style.opacity = '0.15';
                hotspot.style.backgroundColor = 'rgba(200, 100, 100, 0.3)';
            }
        }
    });
}

// 处理手术室区域点击
function handleOperatingRoomAreaClick(area) {
    // 如果已经找到线索，不再处理点击
    if (gameState.operatingRoomClueFound) return;
    
    // 如果点击了错误的区域
    if (!area.isCorrect) {
        // 如果已经点击过这个错误区域，不重复处理
        if (gameState.operatingRoomWrongClickedAreas.includes(area.id)) {
            showDescription('你已经检查过这里了。');
            return;
        }
        
        showDescription('找到了一些上面有暗淡血迹散落的纸张...');
        
        // 添加已点击的错误区域
        gameState.operatingRoomWrongClickedAreas.push(area.id);
        
        // 计算总点击次数
        const totalClicks = gameState.operatingRoomClickedAreas.length + gameState.operatingRoomWrongClickedAreas.length;
        
        // 如果总点击次数达到3次
        if (totalClicks >= 3) {
            // 如果包含错误区域（1个或2个），显示误导护理记录
            if (gameState.operatingRoomWrongClickedAreas.length >= 1) {
                gameState.operatingRoomClueFound = true;
                showDescription('将手上的纸张碎片拼凑起来，好像是一份护理记录，看上去是上个月的。');
                
                // 清除热点
                clearHotspots();
                
                // 延迟显示误导护理记录
                setTimeout(() => {
                    showMisleadingNursingRecordModal();
                }, 2000);
            }
        }
        
        // 更新热点显示
        clearHotspots();
        createOperatingRoomHotspots();
        return;
    }
    
    // 如果已经点击过这个正确区域
    if (gameState.operatingRoomClickedAreas.includes(area.id)) {
        showDescription('你已经检查过这里了。');
        return;
    }
    
    // 添加已点击的正确区域（不再检查顺序）
    gameState.operatingRoomClickedAreas.push(area.id);
    
    // 更新热点显示（标记已点击的正确区域）
    clearHotspots();
    createOperatingRoomHotspots();
    
    // 根据点击的进度显示不同的描述
    if (gameState.operatingRoomClickedAreas.length === 1) {
        showDescription('你在手术台下方发现了一些散落的纸张...');
    } else if (gameState.operatingRoomClickedAreas.length === 2) {
        showDescription('器械台上也有类似的纸张，似乎是护理记录的一部分...');
    }
    
    // 计算总点击次数
    const totalClicks = gameState.operatingRoomClickedAreas.length + gameState.operatingRoomWrongClickedAreas.length;
    
    // 如果总点击次数达到3次且3个都是正确的
    if (totalClicks >= 3 && gameState.operatingRoomClickedAreas.length === 3) {
        // 找到了完整的护理记录
        gameState.operatingRoomClueFound = true;
        gameState.hasCorrectNursingRecord = true; // 标记已收集到正确的护理记录
        showDescription('你在垃圾桶里找到了完整的护理记录！这是受惊吓离开的护士留下的住院部病人的护理记录。');
        
        // 清除热点
        clearHotspots();
        
        // 显示线索按钮
        setTimeout(() => {
            showOperatingRoomClue();
        }, 2000);
    } else if (totalClicks >= 3 && gameState.operatingRoomWrongClickedAreas.length >= 1) {
        // 如果总点击次数达到3次且包含错误区域，显示误导护理记录
        gameState.operatingRoomClueFound = true;
        showDescription('将手上的纸张碎片拼凑起来，好像是一份护理记录，有些信息被血渍覆盖了。');
        
        // 清除热点
        clearHotspots();
        
        // 延迟显示误导护理记录
        setTimeout(() => {
            showMisleadingNursingRecordModal();
        }, 2000);
    }
}

// 显示找到的护理记录线索
function showOperatingRoomClue() {
    const container = document.getElementById('choicesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    const clueButton = document.createElement('button');
    clueButton.className = 'choice-button w-full p-3 rounded-lg text-left mb-2';
    clueButton.textContent = '查看护理记录';
    clueButton.onclick = () => {
        showNursingRecordModal();
    };
    container.appendChild(clueButton);
}

// 显示误导的护理记录详情
function showMisleadingNursingRecordModal() {
    // 打开误导的护理记录HTML文件
    const recordWindow = window.open('misleading_nursing_record.html', '护理记录', 'width=900,height=700,scrollbars=yes');
    
    // 监听来自误导护理记录窗口的消息
    window.addEventListener('message', function handleMisleadingRecordMessage(event) {
        if (event.data && event.data.type === 'misleadingNursingRecordClosed') {
            // 移除监听器
            window.removeEventListener('message', handleMisleadingRecordMessage);
            
            // 显示提示，引导玩家前往4楼401
            showDescription('护理记录显示患者已转移至4楼401号房间。也许应该去那里看看...');
            
            // 显示消防通道按钮（如果还没有显示）
            setTimeout(() => {
                const container = document.getElementById('choicesContainer');
                if (container) {
                    // 检查是否已经有消防通道按钮
                    const existingButton = container.querySelector('button');
                    if (!existingButton || existingButton.textContent !== '消防通道') {
                        const fireExitButton = document.createElement('button');
                        fireExitButton.className = 'choice-button w-full p-3 rounded-lg text-left mb-2';
                        fireExitButton.textContent = '消防通道';
                        fireExitButton.onclick = () => {
                            showFireExitFloorModal();
                        };
                        container.appendChild(fireExitButton);
                    }
                }
            }, 1000);
        }
    });
}

// 显示护理记录详情
function showNursingRecordModal() {
    // 打开专门的护理记录HTML文件
    const recordWindow = window.open('nursing_record.html', '护理记录', 'width=900,height=700,scrollbars=yes');
    
    // 监听来自护理记录窗口的消息
    window.addEventListener('message', function handleRecordMessage(event) {
        if (event.data && event.data.type === 'nursingRecordClosed') {
            // 护理记录窗口关闭
            window.removeEventListener('message', handleRecordMessage);
            
            // 标记已查看过护理记录
            gameState.operatingRoomClueViewed = true;
            
            // 显示描述
            showDescription('护理记录显示：原717床的病人在昨晚经过陈橘子院长亲自进行手术后，今晚原本是婷护士去查看病人并配药，后来因为某些原因转移到了2楼某个房间。记录中部分内容被涂抹，但配药比例清晰可见（A药：B药：C药 = 3:2:1，总量30ml）。');
            
            // 显示"离开手术室"按钮
            const container = document.getElementById('choicesContainer');
            if (container) {
                container.innerHTML = '';
                
                const leaveButton = document.createElement('button');
                leaveButton.className = 'choice-button w-full p-4 rounded-lg text-left text-lg mb-2';
                leaveButton.textContent = '离开手术室';
                leaveButton.onclick = () => {
                    leaveOperatingRoom();
                };
                container.appendChild(leaveButton);
            }
        }
    });
}

// 处理前往2楼时的特殊流程
function handleFloor2SpecialSequence() {
    // 标记已经触发过特殊流程，确保只触发一次
    gameState.floor2SequenceTriggered = true;
    console.log('handleFloor2SpecialSequence: 设置floor2SequenceTriggered = true');
    
    // 禁用所有按钮交互，防止重复触发
    disableAllButtons();
    
    // 轻柔地停止当前BGM（用于播放保安音频）
    pauseCurrentBGM();
    
    // 第一步：显示"三楼好像听到谁在打电话"
    showDescription('刚步行到三楼，好像听到谁在打电话。（需要仔细听音频）');
    
    // 等待文字描述显示完成后消失
    setTimeout(() => {
        const descEl = document.getElementById('descriptionText');
        if (descEl) {
            descEl.style.transition = 'opacity 1s ease-out';
            descEl.style.opacity = '0';
            setTimeout(() => {
                descEl.textContent = '';
                descEl.style.opacity = '1';
                descEl.style.transition = '';
                
                // 第二步：播放peiyin.mp3
                const audio = document.getElementById('peiyinAudio');
                if (audio) {
                    // 重置音频到开始位置
                    audio.currentTime = 0;
                    
                    // 检查音频是否已加载
                    const playAudio = () => {
                        // 检查音频是否准备好
                        if (audio.readyState >= 2) { // HAVE_CURRENT_DATA 或更高
                            audio.play().then(() => {
                                console.log('保安音频开始播放');
                            }).catch(e => {
                                console.error('音频播放失败:', e);
                                console.error('错误详情:', {
                                    name: e.name,
                                    message: e.message,
                                    readyState: audio.readyState,
                                    networkState: audio.networkState,
                                    error: audio.error
                                });
                                // 如果播放失败，恢复BGM并直接显示下一步
                                resumeCurrentBGM();
                                setTimeout(() => {
                                    showDescription('躲在消防通道听到保安渐渐走远了，现在该去哪里？');
                                    // 进入2楼场景（文字描述不消失，直接显示按钮）
                                    setTimeout(() => {
                                        gameState.isFloor2SequenceActive = false; // 标记特殊流程结束
                                        enableAllButtons(); // 重新启用按钮
                                        gameState.unlockRoom('floor_2');
                                        // 直接切换到2楼场景，不调用changeScene避免覆盖描述
                                        const scene = gameData.scenes['floor_2'];
                                        if (scene) {
                                            gameState.currentScene = 'floor_2';
                                            const sceneContainer = document.getElementById('sceneContainer');
                                            if (sceneContainer) {
                                                sceneContainer.style.backgroundImage = `url('${scene.background}')`;
                                            }
                                            // 清除热点和observables
                                            clearHotspots();
                                            clearObservables();
                                        }
                                        // 显示选择按钮（文字描述保持显示，不消失）
                                        setTimeout(() => {
                                            showFloor2ChoiceButtons();
                                        }, 500);
                                    }, 2000); // 减少延迟，让按钮更快显示
                                }, 1000);
                            });
                        } else {
                            // 音频还未加载完成，等待加载
                            console.log('音频加载中，等待加载完成...', 'readyState:', audio.readyState);
                            audio.addEventListener('canplaythrough', () => {
                                console.log('音频加载完成，开始播放');
                                audio.play().catch(e => {
                                    console.error('音频播放失败:', e);
                                    resumeCurrentBGM();
                                    setTimeout(() => {
                                        showDescription('躲在消防通道听到保安渐渐走远了，现在该去哪里？');
                                        setTimeout(() => {
                                            gameState.isFloor2SequenceActive = false;
                                            enableAllButtons();
                                            gameState.unlockRoom('floor_2');
                                            const scene = gameData.scenes['floor_2'];
                                            if (scene) {
                                                gameState.currentScene = 'floor_2';
                                                const sceneContainer = document.getElementById('sceneContainer');
                                                if (sceneContainer) {
                                                    sceneContainer.style.backgroundImage = `url('${scene.background}')`;
                                                }
                                                clearHotspots();
                                                clearObservables();
                                            }
                                            setTimeout(() => {
                                                showFloor2ChoiceButtons();
                                            }, 500);
                                        }, 2000);
                                    }, 1000);
                                });
                            }, { once: true });
                            
                            // 如果5秒后还没加载完成，直接跳过
                            setTimeout(() => {
                                if (audio.readyState < 2) {
                                    console.warn('音频加载超时，跳过播放');
                                    resumeCurrentBGM();
                                    setTimeout(() => {
                                        showDescription('躲在消防通道听到保安渐渐走远了，现在该去哪里？');
                                        setTimeout(() => {
                                            gameState.isFloor2SequenceActive = false;
                                            enableAllButtons();
                                            gameState.unlockRoom('floor_2');
                                            const scene = gameData.scenes['floor_2'];
                                            if (scene) {
                                                gameState.currentScene = 'floor_2';
                                                const sceneContainer = document.getElementById('sceneContainer');
                                                if (sceneContainer) {
                                                    sceneContainer.style.backgroundImage = `url('${scene.background}')`;
                                                }
                                                clearHotspots();
                                                clearObservables();
                                            }
                                            setTimeout(() => {
                                                showFloor2ChoiceButtons();
                                            }, 500);
                                        }, 2000);
                                    }, 1000);
                                }
                            }, 5000);
                        }
                    };
                    
                    // 如果音频有错误，处理错误
                    audio.addEventListener('error', (e) => {
                        console.error('音频加载错误:', {
                            error: audio.error,
                            networkState: audio.networkState,
                            readyState: audio.readyState,
                            src: audio.src || audio.currentSrc
                        });
                        resumeCurrentBGM();
                        setTimeout(() => {
                            showDescription('躲在消防通道听到保安渐渐走远了，现在该去哪里？');
                            setTimeout(() => {
                                gameState.isFloor2SequenceActive = false;
                                enableAllButtons();
                                gameState.unlockRoom('floor_2');
                                const scene = gameData.scenes['floor_2'];
                                if (scene) {
                                    gameState.currentScene = 'floor_2';
                                    const sceneContainer = document.getElementById('sceneContainer');
                                    if (sceneContainer) {
                                        sceneContainer.style.backgroundImage = `url('${scene.background}')`;
                                    }
                                    clearHotspots();
                                    clearObservables();
                                }
                                setTimeout(() => {
                                    showFloor2ChoiceButtons();
                                }, 500);
                            }, 2000);
                        }, 1000);
                    }, { once: true });
                    
                    // 尝试播放
                    playAudio();
                    
                    // 监听音频播放完成
                    audio.addEventListener('ended', () => {
                        // 保安音频播放完成后，恢复BGM
                        resumeCurrentBGM();
                        
                        // 第三步：显示"躲在消防通道听到保安渐渐走远了，现在该去哪里？"
                        showDescription('躲在消防通道听到保安渐渐走远了，现在该去哪里？');
                        // 进入2楼场景（文字描述不消失，直接显示按钮）
                        setTimeout(() => {
                            gameState.isFloor2SequenceActive = false; // 标记特殊流程结束
                            enableAllButtons(); // 重新启用按钮
                            gameState.unlockRoom('floor_2');
                            // 直接切换到2楼场景，不调用changeScene避免覆盖描述
                            const scene = gameData.scenes['floor_2'];
                            if (scene) {
                                gameState.currentScene = 'floor_2';
                                const sceneContainer = document.getElementById('sceneContainer');
                                if (sceneContainer) {
                                    sceneContainer.style.backgroundImage = `url('${scene.background}')`;
                                }
                                // 清除热点和observables
                                clearHotspots();
                                clearObservables();
                            }
                            // 显示选择按钮（文字描述保持显示，不消失）
                            setTimeout(() => {
                                showFloor2ChoiceButtons();
                            }, 500);
                        }, 2000); // 减少延迟，让按钮更快显示
                    }, { once: true });
                } else {
                    // 如果音频元素不存在，恢复BGM并直接显示下一步
                    resumeCurrentBGM();
                    setTimeout(() => {
                        showDescription('躲在消防通道听到保安渐渐走远了，现在该去哪里？');
                        // 进入2楼场景（文字描述不消失，直接显示按钮）
                        setTimeout(() => {
                            gameState.isFloor2SequenceActive = false; // 标记特殊流程结束
                            enableAllButtons(); // 重新启用按钮
                            gameState.unlockRoom('floor_2');
                            // 直接切换到2楼场景，不调用changeScene避免覆盖描述
                            const scene = gameData.scenes['floor_2'];
                            if (scene) {
                                gameState.currentScene = 'floor_2';
                                const sceneContainer = document.getElementById('sceneContainer');
                                if (sceneContainer) {
                                    sceneContainer.style.backgroundImage = `url('${scene.background}')`;
                                }
                                // 清除热点和observables
                                clearHotspots();
                                clearObservables();
                            }
                            // 显示选择按钮（文字描述保持显示，不消失）
                            setTimeout(() => {
                                showFloor2ChoiceButtons();
                            }, 500);
                        }, 2000); // 减少延迟，让按钮更快显示
                    }, 1000);
                }
            }, 1000);
        }
    }, 3000); // 等待3秒让文字描述显示完成
}

// 显示2楼的选择按钮（203或三楼电工房）
function showFloor2ChoiceButtons() {
    const container = document.getElementById('choicesContainer');
    if (!container) return;
    
    // 清除现有按钮
    container.innerHTML = '';
    
    // 创建203按钮（触发失败结局）
    const room203Button = document.createElement('button');
    room203Button.className = 'choice-button w-full p-4 rounded-lg text-left text-lg mb-2';
    room203Button.textContent = '203';
    room203Button.onclick = () => {
        handleRoom203Choice();
    };
    container.appendChild(room203Button);
    
    // 创建三楼电工房按钮（切换到archive场景）
    const electricRoomButton = document.createElement('button');
    electricRoomButton.className = 'choice-button w-full p-4 rounded-lg text-left text-lg mb-2';
    electricRoomButton.textContent = '三楼电工房';
    electricRoomButton.onclick = () => {
        handleElectricRoomChoice();
    };
    container.appendChild(electricRoomButton);
}

// 处理从电工房进入2楼的特殊流程
function handleFloor2FromArchive() {
    // 切换到2楼场景
    const scene = gameData.scenes['floor_2'];
    if (scene) {
        gameState.currentScene = 'floor_2';
        const sceneContainer = document.getElementById('sceneContainer');
        if (sceneContainer) {
            sceneContainer.style.backgroundImage = `url('${scene.background}')`;
        }
        // 清除热点和observables
        clearHotspots();
        clearObservables();
    }
    
    // 显示特殊描述
    showDescription('本该一片死寂的医院，来到2楼好像听到有人的呼喊声。');
    
    // 显示"前往203病房"按钮
    setTimeout(() => {
        showFloor2FromArchiveButtons();
    }, 500);
}

// 显示从电工房进入2楼时的按钮（前往203病房）
function showFloor2FromArchiveButtons() {
    const container = document.getElementById('choicesContainer');
    if (!container) return;
    
    // 清除现有按钮
    container.innerHTML = '';
    
    // 创建"前往203病房"按钮
    const room203Button = document.createElement('button');
    room203Button.className = 'choice-button w-full p-4 rounded-lg text-left text-lg mb-2';
    room203Button.textContent = '前往203病房';
    room203Button.onclick = () => {
        handleGoToRoom203();
    };
    container.appendChild(room203Button);
}

// 处理前往203病房
function handleGoToRoom203() {
    // 清除所有按钮
    const container = document.getElementById('choicesContainer');
    if (container) {
        container.innerHTML = '';
    }
    
    showDescription('你决定前往203病房...');
    setTimeout(() => {
        // 设置标记，表示当前是203病房而不是717病房
        gameState.isRoom203 = true;
        console.log('设置isRoom203 = true, key203Obtained =', gameState.key203Obtained);
        // 解锁room_717场景（复用场景）
        gameState.unlockRoom('room_717');
        const room717Scene = gameData.scenes['room_717'];
        if (room717Scene) {
            room717Scene.locked = false;
            room717Scene.requiredPuzzle = null;
        }
        // 切换到room_717场景（作为203病房）
        changeScene('room_717');
    }, 2000);
}

// 处理使用203钥匙
function handleUseRoom203Key() {
    gameState.room203KeyUsed = true;
    // 更新描述
    showDescription('推开203的门，里面有个人穿着约束衣被固定在床上。他一直在挣扎，嘴里喊着意义不明的话。');
    // 清除按钮
    clearObservables();
    // 延迟创建配药热点
    setTimeout(() => {
        createRoom203MedicineHotspot();
    }, 2000);
}

// 创建203病房配药热点（在图片正中间）
function createRoom203MedicineHotspot() {
    const container = document.getElementById('hotspotsContainer');
    if (!container) return;
    
    // 如果已经解决过配药谜题，不再创建热点
    if (gameState.solvedPuzzles.includes('medicine_mix')) {
        return;
    }
    
    // 在图片正中间创建热点
    const hotspot = document.createElement('div');
    hotspot.className = 'absolute cursor-pointer transition-all duration-300';
    hotspot.style.left = '45%'; // 正中间偏左一点
    hotspot.style.top = '45%'; // 正中间
    hotspot.style.width = '10%';
    hotspot.style.height = '10%';
    hotspot.style.opacity = '0';
    
    // 鼠标悬停效果
    hotspot.addEventListener('mouseenter', () => {
        hotspot.style.opacity = '0.2';
        hotspot.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        hotspot.style.border = '2px dashed rgba(255, 255, 255, 0.5)';
    });
    
    hotspot.addEventListener('mouseleave', () => {
        hotspot.style.opacity = '0';
        hotspot.style.backgroundColor = 'transparent';
        hotspot.style.border = 'none';
    });
    
    // 点击事件
    hotspot.addEventListener('click', () => {
        handleRoom203MedicineClick();
    });
    
    container.appendChild(hotspot);
}

// 处理203病房配药热点点击
function handleRoom203MedicineClick() {
    showDescription('旁边有未配完的药，或许可以配完药给他服用？');
    // 延迟打开配药界面
    setTimeout(() => {
        const medicineWindow = window.open('medicine_mix.html', '配药', 'width=600,height=700,scrollbars=no,resizable=yes');
        
        // 监听来自配药窗口的消息
        window.addEventListener('message', function handleMedicineMessage(event) {
            if (event.data && event.data.type === 'medicineMixSuccess') {
                // 配药成功
                window.removeEventListener('message', handleMedicineMessage);
                gameState.solvePuzzle('medicine_mix');
                gameState.room203PatientAwake = true;
                showDescription('203病人喝下你配的药，慢慢冷静下来，恢复清醒。');
                // 清除配药热点
                clearHotspots();
                // 延迟显示第一段对话
                const typingDuration = '203病人喝下你配的药，慢慢冷静下来，恢复清醒。'.length * 50 + 500;
                setTimeout(() => {
                    showRoom203PatientDialogue();
                }, typingDuration);
            } else if (event.data && event.data.type === 'medicineMixFailed') {
                // 配药失败
                window.removeEventListener('message', handleMedicineMessage);
                showDescription('203病人喝下你配的药，变得更加疯狂，身后有人被他的动静引来了。。。');
                // 延迟触发失败结局
                setTimeout(() => {
                    triggerWrongFloorEnding('203病房配药错误');
                }, 2000);
            }
        });
    }, 2000);
}

// 显示203病人对话
function showRoom203PatientDialogue() {
    if (gameState.room203DialogueStep === 0) {
        // 第一段对话
        gameState.room203DialogueStep = 1;
        const dialogueText = '你是来结束这一切的人吗？我是这项x-17项目实验的助手，她的一切罪证都在地下室。地下室是隐藏的，只有特殊的电梯卡才能前往。而且地下室的密码只有她和建造地下室的设计师知道。';
        showDescription(dialogueText);
        
        // 等待打字机效果完成后显示按钮
        const typingDuration = dialogueText.length * 50 + 500;
        setTimeout(() => {
            const container = document.getElementById('choicesContainer');
            if (container) {
                container.innerHTML = '';
                const button = document.createElement('button');
                button.className = 'choice-button w-full p-3 rounded-lg text-left mb-2';
                button.textContent = '那设计师在哪？';
                button.onclick = () => {
                    handleRoom203DesignerQuestion();
                };
                container.appendChild(button);
            }
        }, typingDuration);
    }
}

// 处理"那设计师在哪？"按钮点击
function handleRoom203DesignerQuestion() {
    // 清除按钮
    const container = document.getElementById('choicesContainer');
    if (container) {
        container.innerHTML = '';
    }
    
    // 显示第二段对话
    gameState.room203DialogueStep = 2;
    const dialogueText = '设计师早就被她带进地下室，永远出不来了。不过当时他们进地下室前好像有什么动静，你或许可以去监控室看一下。';
    showDescription(dialogueText);
    
    // 等待打字机效果完成后显示按钮
    const typingDuration = dialogueText.length * 50 + 500;
    setTimeout(() => {
        if (container) {
            const button = document.createElement('button');
            button.className = 'choice-button w-full p-3 rounded-lg text-left mb-2';
            button.textContent = '前往监控室';
            button.onclick = () => {
                handleGoToMonitoringRoom();
            };
            container.appendChild(button);
        }
    }, typingDuration);
}

// 处理"前往监控室"按钮点击
function handleGoToMonitoringRoom() {
    // 清除按钮
    const container = document.getElementById('choicesContainer');
    if (container) {
        container.innerHTML = '';
    }
    
    // 通过203病人对话进入监控室，先解锁监控室
    gameState.unlockRoom('monitor');
    
    // 切换到监控室场景
    changeScene('monitor');
}

// 处理监控室"查看屏幕"按钮点击
function handleMonitorScreenClick() {
    // 显示手势描述
    const descriptionText = '反复观察设计师的手势，好像是：0x207D';
    showDescription(descriptionText);
    
    // 清除"查看屏幕"按钮
    clearObservables();
    
    // 等待打字机效果完成后显示"前往电梯间"按钮
    const typingDuration = descriptionText.length * 50 + 500;
    setTimeout(() => {
        const container = document.getElementById('choicesContainer');
        if (container) {
            const button = document.createElement('button');
            button.className = 'choice-button w-full p-3 rounded-lg text-left mb-2';
            button.textContent = '前往电梯间';
            button.onclick = () => {
                handleGoToElevator();
            };
            container.appendChild(button);
        }
    }, typingDuration);
}

// 处理"前往电梯间"按钮点击
function handleGoToElevator() {
    // 清除按钮
    const container = document.getElementById('choicesContainer');
    if (container) {
        container.innerHTML = '';
    }
    
    // 检查是否获得了电梯卡
    if (gameState.hasElevatorCard) {
        // 有电梯卡，显示描述并切换到地下电梯场景
        showDescription('来到电梯间，用电梯卡刷开了电梯，电梯缓缓下行。');
        const typingDuration = '来到电梯间，用电梯卡刷开了电梯，电梯缓缓下行。'.length * 50 + 500;
        setTimeout(() => {
            changeScene('underground_elevator');
        }, typingDuration);
    } else {
        // 没有电梯卡，触发失败结局
        const descriptionText = '你在电梯间徘徊，身后传来脚步声。';
        showDescription(descriptionText);
        // 等待打字机效果完成后触发失败结局
        const typingDuration = descriptionText.length * 50 + 500;
        setTimeout(() => {
            triggerFailureEnding();
        }, typingDuration);
    }
}

// 显示地下电梯密码输入窗口
function showUndergroundPasswordModal() {
    const modal = document.getElementById('undergroundPasswordModal');
    const grid = document.getElementById('binaryPasswordGrid');
    
    if (modal && grid) {
        modal.classList.remove('hidden');
        
        // 清空并创建16个二进制格子
        grid.innerHTML = '';
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.className = 'binary-cell w-12 h-12 bg-gray-700 hover:bg-gray-600 border-2 border-gray-500 rounded-lg flex items-center justify-center text-2xl font-bold cursor-pointer transition-all';
            cell.textContent = '0';
            cell.dataset.index = i;
            cell.dataset.value = '0';
            cell.onclick = () => toggleBinaryCell(cell);
            grid.appendChild(cell);
        }
    }
}

// 切换二进制格子的值（0和1之间切换）
function toggleBinaryCell(cell) {
    const currentValue = cell.dataset.value;
    const newValue = currentValue === '0' ? '1' : '0';
    cell.dataset.value = newValue;
    cell.textContent = newValue;
    
    // 更新颜色以提供视觉反馈
    if (newValue === '1') {
        cell.classList.remove('bg-gray-700', 'hover:bg-gray-600');
        cell.classList.add('bg-green-600', 'hover:bg-green-500');
    } else {
        cell.classList.remove('bg-green-600', 'hover:bg-green-500');
        cell.classList.add('bg-gray-700', 'hover:bg-gray-600');
    }
}

// 隐藏地下电梯密码输入窗口
function hideUndergroundPasswordModal() {
    const modal = document.getElementById('undergroundPasswordModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// 确认地下电梯密码
function confirmUndergroundPassword() {
    const grid = document.getElementById('binaryPasswordGrid');
    if (!grid) return;
    
    // 收集所有格子的值
    const cells = grid.querySelectorAll('.binary-cell');
    let enteredPassword = '';
    cells.forEach(cell => {
        enteredPassword += cell.dataset.value;
    });
    
    // 正确密码：0010 0000 0111 1101
    const correctPassword = '0010000001111101';
    
    if (enteredPassword === correctPassword) {
        hideUndergroundPasswordModal();
        gameState.basementPasswordEntered = true;
        // 清除"输入密码"按钮
        clearObservables();
        // 切换到地下室BGM（bgm4）
        updateBGMForScene('underground_elevator');
        showDescription('密码正确！地下室门打开了。');
        // 延迟显示地下室描述和创建热点
        const typingDuration = '密码正确！地下室门打开了。'.length * 50 + 1000;
        setTimeout(() => {
            showBasementDescription();
        }, typingDuration);
    } else {
        // 密码错误，所有格子闪烁红色提示
        cells.forEach(cell => {
            // 添加红色背景
            cell.style.backgroundColor = '#ef4444';
            cell.style.transition = 'background-color 0.3s';
        });
        // 1秒后触发失败结局
        setTimeout(() => {
            triggerFailureEnding();
        }, 1000);
    }
}

// 显示地下室描述并创建热点
function showBasementDescription() {
    showDescription('一股刺激性气味从地下室穿出，这里到处都是实验痕迹。');
    // 创建热点
    createBasementHotspots();
    // 显示电脑相关描述和按钮
    const typingDuration = '一股刺激性气味从地下室穿出，这里到处都是实验痕迹。'.length * 50 + 500;
    setTimeout(() => {
        showBasementComputerDescription();
    }, typingDuration);
}

// 显示电脑描述和按钮
function showBasementComputerDescription() {
    const container = document.getElementById('choicesContainer');
    if (container) {
        // 不清除现有按钮，直接添加新按钮
        // 等待原有文字描述显示完成后显示按钮
        const typingDuration = '一股刺激性气味从地下室穿出，这里到处都是实验痕迹。'.length * 50 + 500;
        setTimeout(() => {
            const button = document.createElement('button');
            button.className = 'choice-button w-full p-3 rounded-lg text-left mb-2';
            button.textContent = '找到了一台电脑，看着是用来记录实验数据。';
            button.onclick = () => {
                showBasementComputerPasswordModal();
            };
            container.appendChild(button);
        }, typingDuration);
    }
}

// 创建地下室的可点击热点区域
function createBasementHotspots() {
    const container = document.getElementById('hotspotsContainer');
    if (!container) return;
    
    // 如果已经收集了所有线索，不再显示热点
    if (gameState.basementCluesCollected.length >= 3) return;
    
    // 定义3个可点击区域（位置与手术室不同）
    const clickableAreas = [
        { id: 'basement_area1', x: 15, y: 30, width: 10, height: 10, order: 1, clue: '你找到了线索：项目名：x-17' },
        { id: 'basement_area2', x: 60, y: 50, width: 10, height: 10, order: 2, clue: '你找到了线索：项目负责人：陈橘子' },
        { id: 'basement_area3', x: 35, y: 70, width: 10, height: 10, order: 3, clue: '你找到了线索：项目启动时间：20230824' }
    ];
    
    clickableAreas.forEach(area => {
        // 如果已经收集过这个线索，跳过
        if (gameState.basementCluesCollected.includes(area.id)) return;
        
        const hotspot = document.createElement('div');
        hotspot.className = 'absolute cursor-pointer transition-all duration-300';
        hotspot.style.left = `${area.x}%`;
        hotspot.style.top = `${area.y}%`;
        hotspot.style.width = `${area.width}%`;
        hotspot.style.height = `${area.height}%`;
        hotspot.style.opacity = '0';
        hotspot.dataset.areaId = area.id;
        hotspot.dataset.order = area.order;
        
        // 鼠标悬停效果
        hotspot.addEventListener('mouseenter', () => {
            hotspot.style.opacity = '0.2';
            hotspot.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            hotspot.style.border = '2px dashed rgba(255, 255, 255, 0.5)';
        });
        
        hotspot.addEventListener('mouseleave', () => {
            if (gameState.basementCluesCollected.includes(area.id)) {
                hotspot.style.opacity = '0.15';
                hotspot.style.backgroundColor = 'rgba(100, 200, 255, 0.3)';
            } else {
                hotspot.style.opacity = '0';
                hotspot.style.backgroundColor = 'transparent';
            }
            hotspot.style.border = 'none';
        });
        
        hotspot.addEventListener('click', () => {
            handleBasementAreaClick(area);
        });
        
        container.appendChild(hotspot);
    });
    
    // 更新已点击区域的显示状态
    clickableAreas.forEach(area => {
        if (gameState.basementCluesCollected.includes(area.id)) {
            const hotspot = container.querySelector(`[data-area-id="${area.id}"]`);
            if (hotspot) {
                hotspot.style.opacity = '0.15';
                hotspot.style.backgroundColor = 'rgba(100, 200, 255, 0.3)';
            }
        }
    });
}

// 处理地下室区域点击
function handleBasementAreaClick(area) {
    // 如果已经收集过这个线索，不重复处理
    if (gameState.basementCluesCollected.includes(area.id)) {
        showDescription('你已经检查过这里了。');
        return;
    }
    
    // 添加已收集的线索
    gameState.basementCluesCollected.push(area.id);
    
    // 显示线索描述
    showDescription(area.clue);
    
    // 更新热点显示
    clearHotspots();
    createBasementHotspots();
}

// 显示地下室电脑密码输入窗口
function showBasementComputerPasswordModal() {
    const modal = document.getElementById('basementComputerPasswordModal');
    const input = document.getElementById('basementComputerPasswordInput');
    
    if (modal && input) {
        modal.classList.remove('hidden');
        input.value = '';
        input.focus();
    }
}

// 隐藏地下室电脑密码输入窗口
function hideBasementComputerPasswordModal() {
    const modal = document.getElementById('basementComputerPasswordModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// 确认地下室电脑密码
function confirmBasementComputerPassword() {
    const input = document.getElementById('basementComputerPasswordInput');
    if (!input) return;
    
    const enteredPassword = input.value.trim();
    // 正确密码：20230824x-17chenjuzi
    const correctPassword = '20230824x-17chenjuzi';
    
    if (enteredPassword === correctPassword) {
        hideBasementComputerPasswordModal();
        gameState.basementComputerUnlocked = true;
        
        // 清除"找到了一台电脑"按钮
        const container = document.getElementById('choicesContainer');
        if (container) {
            const buttons = container.querySelectorAll('button');
            buttons.forEach(button => {
                if (button.textContent === '找到了一台电脑，看着是用来记录实验数据。') {
                    button.remove();
                }
            });
        }
        
        // 显示描述
        showDescription('电脑解锁成功！你获得了实验数据。');
        
        // 等待打字机效果完成后显示"查看数据"按钮
        const typingDuration = '电脑解锁成功！你获得了实验数据。'.length * 50 + 500;
        setTimeout(() => {
            showBasementDataButton();
        }, typingDuration);
    } else {
        input.style.borderColor = '#ef4444';
        setTimeout(() => {
            input.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        }, 1000);
    }
}

// 显示"查看数据"按钮
function showBasementDataButton() {
    const container = document.getElementById('choicesContainer');
    if (container) {
        const button = document.createElement('button');
        button.className = 'choice-button w-full p-3 rounded-lg text-left mb-2';
        button.textContent = '查看数据';
        button.onclick = () => {
            handleViewBasementData();
        };
        container.appendChild(button);
    }
}

// 处理"查看数据"按钮点击
function handleViewBasementData() {
    // 打开实验数据页面
    const dataWindow = window.open('experiment_clues.html', '实验数据', 'width=900,height=700,scrollbars=yes');
    
    // 监听来自实验数据页面的消息
    window.addEventListener('message', function handleDataWindowMessage(event) {
        if (event.data && event.data.type === 'closeAllAndReturnToMenu') {
            // 移除监听器
            window.removeEventListener('message', handleDataWindowMessage);
            // 关闭所有窗口并返回主菜单
            closeAllWindowsAndReturnToMainMenu();
        }
    });
}

// 关闭所有窗口并返回主菜单
function closeAllWindowsAndReturnToMainMenu() {
    // 跳转到主菜单
    window.location.href = 'start.html';
}

// 处理选择203房间（触发失败结局）
function handleRoom203Choice() {
    // 清除所有按钮
    const container = document.getElementById('choicesContainer');
    if (container) {
        container.innerHTML = '';
    }
    
    showDescription('你走向203房间，突然听到身后传来脚步声...');
    setTimeout(() => {
        // 触发失败结局（被保安抓住）
        triggerWrongFloorEnding('2楼203');
    }, 2000);
}

// 处理选择三楼电工房（切换到archive场景）
function handleElectricRoomChoice() {
    // 清除所有按钮
    const container = document.getElementById('choicesContainer');
    if (container) {
        container.innerHTML = '';
    }
    
    showDescription('你决定前往三楼电工房...');
    setTimeout(() => {
        // 解锁archive场景
        gameState.unlockRoom('archive');
        // 解锁场景（绕过谜题要求）
        const archiveScene = gameData.scenes['archive'];
        if (archiveScene) {
            archiveScene.locked = false;
            archiveScene.requiredPuzzle = null; // 清除谜题要求
        }
        // 切换到archive场景
        changeScene('archive');
    }, 2000);
}

// 创建电梯电箱热点（在图片正中间偏上一点的位置）
function createElectricBoxHotspot() {
    const container = document.getElementById('hotspotsContainer');
    if (!container) return;
    
    // 如果已经修复了电箱，不再创建热点
    if (gameState.electricBoxWiringFixed) return;
    
    // 在图片正中间偏上一点的位置（约45%高度，50%宽度）
    const hotspot = document.createElement('div');
    hotspot.className = 'absolute cursor-pointer transition-all duration-300';
    hotspot.style.left = '45%'; // 正中间偏左一点
    hotspot.style.top = '30%'; // 偏上一点
    hotspot.style.width = '10%';
    hotspot.style.height = '20%';
    hotspot.style.opacity = '0';
    
    // 鼠标悬停效果
    hotspot.addEventListener('mouseenter', () => {
        hotspot.style.opacity = '0.2';
        hotspot.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        hotspot.style.border = '2px dashed rgba(255, 255, 255, 0.5)';
    });
    
    hotspot.addEventListener('mouseleave', () => {
        hotspot.style.opacity = '0';
        hotspot.style.backgroundColor = 'transparent';
        hotspot.style.border = 'none';
    });
    
    hotspot.addEventListener('click', () => {
        handleElectricBoxClick();
    });
    
    container.appendChild(hotspot);
}

// 处理电梯电箱点击（第二个函数，可能是重复的）
function handleElectricBoxClick() {
    gameState.electricBoxChecked = true;
    showDescription('发现一个箱子，需要连线解锁。');
    
    // 不清除电箱热点，只有在修复完成后才清除（通过electricBoxWiringFixed判断）
    
    // 打开独立的连线游戏窗口
    setTimeout(() => {
        const wiringWindow = window.open('electric_box_wiring.html', '电梯电箱接线', 'width=900,height=700,scrollbars=no,resizable=yes');
        
        // 监听来自连线窗口的消息
        window.addEventListener('message', function handleWiringMessage(event) {
            if (event.data && event.data.type === 'electricBoxWiringSuccess') {
                // 连线成功
                window.removeEventListener('message', handleWiringMessage);
                gameState.electricBoxWiringFixed = true;
                gameState.hasElevatorCard = true; // 获得电梯卡
                showDescription('连线成功！你获得了电梯卡。');
                // 清除电箱热点
                clearHotspots();
            } else if (event.data && event.data.type === 'electricBoxWiringFailed') {
                // 连线失败
                window.removeEventListener('message', handleWiringMessage);
                triggerWrongFloorEnding('电梯电箱接线错误');
            }
        });
    }, 2000);
}

// 处理203钥匙点击
function handleKey203Click() {
    gameState.key203Obtained = true;
    showDescription('你获得了203房间的钥匙。');
    
    // 更新按钮：移除"203钥匙"按钮，显示"消防通道"按钮
    setTimeout(() => {
        const container = document.getElementById('choicesContainer');
        if (container) {
            container.innerHTML = '';
            
            const fireExitButton = document.createElement('button');
            fireExitButton.className = 'choice-button w-full p-3 rounded-lg text-left mb-2';
            fireExitButton.textContent = '消防通道';
            fireExitButton.onclick = () => {
                showFireExitFloorModal();
            };
            container.appendChild(fireExitButton);
            
            // 如果完成了7个谜题，也显示"揭露真相"按钮
            if (gameState.solvedPuzzles.length >= 7) {
                const finalButton = document.createElement('button');
                finalButton.className = 'choice-button w-full p-3 rounded-lg text-left mb-2';
                finalButton.textContent = '揭露真相';
                finalButton.onclick = () => {
                    showPuzzleModal('final_truth');
                };
                container.appendChild(finalButton);
            }
        }
    }, 1500);
}

// 创建电梯电箱热点（在图片正中间偏上一点的位置）
function createElectricBoxHotspot() {
    const container = document.getElementById('hotspotsContainer');
    if (!container) return;
    
    // 如果已经修复了电箱，不再创建热点
    if (gameState.electricBoxWiringFixed) return;
    
    // 在图片正中间偏上一点的位置（约45%高度，50%宽度）
    const hotspot = document.createElement('div');
    hotspot.className = 'absolute cursor-pointer transition-all duration-300';
    hotspot.style.left = '45%'; // 正中间偏左一点
    hotspot.style.top = '30%'; // 偏上一点
    hotspot.style.width = '10%';
    hotspot.style.height = '20%';
    hotspot.style.opacity = '0';
    
    // 鼠标悬停效果
    hotspot.addEventListener('mouseenter', () => {
        hotspot.style.opacity = '0.2';
        hotspot.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        hotspot.style.border = '2px dashed rgba(255, 255, 255, 0.5)';
    });
    
    hotspot.addEventListener('mouseleave', () => {
        hotspot.style.opacity = '0';
        hotspot.style.backgroundColor = 'transparent';
        hotspot.style.border = 'none';
    });
    
    hotspot.addEventListener('click', () => {
        handleElectricBoxClick();
    });
    
    container.appendChild(hotspot);
}

// 处理电梯电箱点击（第二个函数，可能是重复的）
function handleElectricBoxClick() {
    gameState.electricBoxChecked = true;
    showDescription('发现一个箱子，需要连线解锁。');
    
    // 不清除电箱热点，只有在修复完成后才清除（通过electricBoxWiringFixed判断）
    
    // 打开独立的连线游戏窗口
    setTimeout(() => {
        const wiringWindow = window.open('electric_box_wiring.html', '电梯电箱接线', 'width=900,height=700,scrollbars=no,resizable=yes');
        
        // 监听来自连线窗口的消息
        window.addEventListener('message', function handleWiringMessage(event) {
            if (event.data && event.data.type === 'electricBoxWiringSuccess') {
                // 连线成功
                window.removeEventListener('message', handleWiringMessage);
                gameState.electricBoxWiringFixed = true;
                gameState.hasElevatorCard = true; // 获得电梯卡
                showDescription('连线成功！你获得了电梯卡。');
                // 清除电箱热点
                clearHotspots();
            } else if (event.data && event.data.type === 'electricBoxWiringFailed') {
                // 连线失败
                window.removeEventListener('message', handleWiringMessage);
                triggerWrongFloorEnding('电梯电箱接线错误');
            }
        });
    }, 2000);
}

// 处理203钥匙点击
function handleKey203Click() {
    gameState.key203Obtained = true;
    showDescription('你获得了203房间的钥匙。');
    
    // 更新按钮：移除"203钥匙"按钮，显示"消防通道"按钮
    setTimeout(() => {
        const container = document.getElementById('choicesContainer');
        if (container) {
            container.innerHTML = '';
            
            const fireExitButton = document.createElement('button');
            fireExitButton.className = 'choice-button w-full p-3 rounded-lg text-left mb-2';
            fireExitButton.textContent = '消防通道';
            fireExitButton.onclick = () => {
                showFireExitFloorModal();
            };
            container.appendChild(fireExitButton);
            
            // 如果完成了7个谜题，也显示"揭露真相"按钮
            if (gameState.solvedPuzzles.length >= 7) {
                const finalButton = document.createElement('button');
                finalButton.className = 'choice-button w-full p-3 rounded-lg text-left mb-2';
                finalButton.textContent = '揭露真相';
                finalButton.onclick = () => {
                    showPuzzleModal('final_truth');
                };
                container.appendChild(finalButton);
            }
        }
    }, 1500);
}

// 离开手术室，返回走廊
function leaveOperatingRoom() {
    // 切换到走廊场景（不显示默认描述）
    const scene = gameData.scenes['corridor'];
    if (!scene) return;
    
    gameState.currentScene = 'corridor';
    
    const sceneContainer = document.getElementById('sceneContainer');
    if (sceneContainer) sceneContainer.style.backgroundImage = `url('${scene.background}')`;
    
    // 清除所有热点和observables
    clearHotspots();
    clearObservables();
    
    // 直接显示提示文字（不调用changeScene，避免显示默认描述）
    showDescription('现在线索指向2楼，先去二楼看看吧。');
    
    // 显示消防通道按钮
    setTimeout(() => {
        const container = document.getElementById('choicesContainer');
        if (container) {
            container.innerHTML = '';
            
            const fireExitButton = document.createElement('button');
            fireExitButton.className = 'choice-button w-full p-4 rounded-lg text-left text-lg mb-2';
            fireExitButton.textContent = '消防通道';
            fireExitButton.onclick = () => {
                showFireExitFloorModal();
            };
            container.appendChild(fireExitButton);
        }
    }, 500);
}


function showPuzzleModal(puzzleId) {
    const puzzle = puzzles[puzzleId];
    if (!puzzle) return;
    
    const modal = document.getElementById('puzzleModal');
    const titleEl = document.getElementById('puzzleTitle');
    const descEl = document.getElementById('puzzleDescription');
    const questionEl = document.getElementById('puzzleQuestion');
    const inputEl = document.getElementById('puzzleInput');
    const colorWiringContainer = document.getElementById('colorWiringContainer');
    const medicineContainer = document.getElementById('medicineContainer');
    
    if (modal && titleEl && descEl && questionEl && inputEl) {
        // 如果是维吉尼亚密码，隐藏标题并处理描述点击
        if (puzzleId === 'vigenere') {
            // 隐藏标题
            if (titleEl) {
                titleEl.style.display = 'none';
            }
            // 检查是否已点击过描述
            if (gameState.vigenereDescClicked) {
                // 已点击过，显示完整描述
                descEl.textContent = '纸条上凌乱的字迹写着：ZBZCTBBMSQ\n纸条背面记录着：护理部(HULIBU)';
                descEl.style.cursor = 'default';
                descEl.onclick = null;
            } else {
                // 未点击过，显示初始描述，可点击
                descEl.textContent = '纸条上凌乱的字迹写着：ZBZCTBBMSQ';
                descEl.style.cursor = 'pointer';
                descEl.onclick = () => handleVigenereDescClick();
            }
            // 移除下划线样式
            descEl.style.textDecoration = 'none';
            descEl.style.userSelect = 'none';
            // 隐藏question提示
            if (questionEl) {
                questionEl.textContent = '';
                questionEl.style.display = 'none';
            }
        } else if (puzzleId === 'medicine_mix') {
            // 配药谜题：隐藏标题和描述，只显示问题
            if (titleEl) {
                titleEl.style.display = 'none';
            }
            descEl.style.display = 'none';
            descEl.textContent = '';
            descEl.style.cursor = 'default';
            descEl.style.textDecoration = 'none';
            descEl.onclick = null;
            // 只显示问题
            if (questionEl) {
                questionEl.textContent = puzzle.question || '';
                questionEl.style.display = puzzle.question ? 'block' : 'none';
            }
        } else {
            // 显示标题
            if (titleEl) {
                titleEl.textContent = puzzle.name;
                titleEl.style.display = 'block';
            }
            descEl.textContent = puzzle.description;
            descEl.style.cursor = 'default';
            descEl.style.textDecoration = 'none';
            descEl.onclick = null;
            // 显示question提示（如果有）
            if (questionEl) {
                questionEl.textContent = puzzle.question || '';
                questionEl.style.display = puzzle.question ? 'block' : 'none';
            }
        }
        inputEl.value = '';
        
        // 隐藏特殊界面
        if (colorWiringContainer) colorWiringContainer.classList.add('hidden');
        if (medicineContainer) medicineContainer.classList.add('hidden');
        const electricBoxWiringContainer = document.getElementById('electricBoxWiringContainer');
        if (electricBoxWiringContainer) {
            electricBoxWiringContainer.classList.add('hidden');
            electricBoxWiringContainer.style.display = 'none'; // 确保隐藏
        }
        // 查找输入框容器（可能是直接的input，也可能是包裹的div）
        const puzzleInputContainer = document.getElementById('puzzleInputContainer') || (inputEl ? inputEl.parentElement : null);
        if (puzzleInputContainer) puzzleInputContainer.style.display = 'block';
        
        // 显示特殊界面
        if (puzzleId === 'color_wiring') {
            initColorWiring();
        } else if (puzzleId === 'medicine_mix') {
            // 配药谜题：隐藏输入框，显示配药界面
            if (inputEl) inputEl.style.display = 'none';
            if (puzzleInputContainer) puzzleInputContainer.style.display = 'none';
            console.log('准备初始化配药界面');
            // 立即显示容器，不等待
            if (medicineContainer) {
                medicineContainer.classList.remove('hidden');
                medicineContainer.style.display = 'block';
                medicineContainer.style.visibility = 'visible';
                console.log('已显示配药容器');
            }
            // 延迟一点确保DOM已更新后再初始化
            setTimeout(() => {
                initMedicineMix();
            }, 100);
        } else if (puzzleId === 'electric_box_wiring') {
            // 电箱连线游戏，隐藏输入框
            if (inputEl) inputEl.style.display = 'none';
            if (puzzleInputContainer) puzzleInputContainer.style.display = 'none';
            console.log('准备初始化电箱连线游戏，puzzleId:', puzzleId);
            // 立即显示容器，不等待
            if (electricBoxWiringContainer) {
                electricBoxWiringContainer.classList.remove('hidden');
                electricBoxWiringContainer.style.display = 'block';
                electricBoxWiringContainer.style.visibility = 'visible';
                console.log('已显示电箱连线容器');
            }
            // 延迟一点确保DOM已更新后再初始化
            setTimeout(() => {
                initElectricBoxWiring();
            }, 100);
        }
        
        modal.classList.remove('hidden');
        if (puzzleId !== 'electric_box_wiring' && inputEl) {
            inputEl.focus();
        }
        window.currentPuzzle = puzzleId;
    }
}

// 处理维吉尼亚密码描述点击
function handleVigenereDescClick() {
    if (gameState.vigenereDescClicked) return;
    
    gameState.vigenereDescClicked = true;
    const descEl = document.getElementById('puzzleDescription');
    if (descEl) {
        descEl.textContent = '纸条上凌乱的字迹写着：ZBZCTBBMSQ\n纸条背面记录着：护理部(HULIBU)';
        // 移除点击事件，但保留无下划线样式
        descEl.style.cursor = 'default';
        descEl.style.textDecoration = 'none';
        descEl.onclick = null;
    }
}

function initColorWiring() {
    const container = document.getElementById('colorWiringContainer');
    const leftColors = document.getElementById('leftColors');
    const rightColors = document.getElementById('rightColors');
    if (!container || !leftColors || !rightColors) return;
    
    container.classList.remove('hidden');
    leftColors.innerHTML = '';
    rightColors.innerHTML = '';
    
    const left = ['红', '蓝', '绿', '黄', '紫'];
    const right = ['蓝', '红', '黄', '绿', '紫'];
    const colors = { '红': '#ef4444', '蓝': '#3b82f6', '绿': '#10b981', '黄': '#fbbf24', '紫': '#a855f7' };
    
    left.forEach((color, i) => {
        const btn = document.createElement('button');
        btn.className = 'w-full p-2 rounded text-white font-bold';
        btn.style.backgroundColor = colors[color];
        btn.textContent = `${i + 1}. ${color}`;
        btn.dataset.index = i;
        btn.dataset.color = color;
        btn.onclick = () => selectLeftColor(i, color);
        leftColors.appendChild(btn);
    });
    
    right.forEach((color, i) => {
        const btn = document.createElement('button');
        btn.className = 'w-full p-2 rounded text-white font-bold';
        btn.style.backgroundColor = colors[color];
        btn.textContent = `${i + 1}. ${color}`;
        btn.dataset.index = i;
        btn.dataset.color = color;
        btn.onclick = () => selectRightColor(i, color);
        rightColors.appendChild(btn);
    });
    
    window.colorWiring = { left: null, connections: [] };
}

function selectLeftColor(index, color) {
    if (!window.colorWiring) window.colorWiring = { left: null, connections: [] };
    window.colorWiring.left = { index, color };
    updateWiringDisplay();
}

function selectRightColor(index, color) {
    if (!window.colorWiring || !window.colorWiring.left) return;
    window.colorWiring.connections.push({
        left: window.colorWiring.left.index,
        right: index
    });
    window.colorWiring.left = null;
    updateWiringDisplay();
    updateWiringAnswer();
}

function updateWiringDisplay() {
    const container = document.getElementById('wiringConnections');
    if (!container || !window.colorWiring) return;
    
    container.innerHTML = '';
    if (window.colorWiring.connections.length > 0) {
        const text = window.colorWiring.connections.map(c => `${c.left + 1}-${c.right + 1}`).join('-');
        container.innerHTML = `<div class="text-white">连接顺序: ${text}</div>`;
    }
}

function updateWiringAnswer() {
    const input = document.getElementById('puzzleInput');
    if (!input || !window.colorWiring) return;
    
    if (window.colorWiring.connections.length === 5) {
        const answer = window.colorWiring.connections.map(c => c.right + 1).join('-');
        input.value = answer;
    }
}

function initMedicineMix() {
    const container = document.getElementById('medicineContainer');
    const medicineA = document.getElementById('medicineA');
    const medicineB = document.getElementById('medicineB');
    const medicineC = document.getElementById('medicineC');
    const total = document.getElementById('totalMedicine');
    
    console.log('initMedicineMix 被调用');
    console.log('容器元素:', {
        container: !!container,
        medicineA: !!medicineA,
        medicineB: !!medicineB,
        medicineC: !!medicineC,
        total: !!total
    });
    
    if (!container) {
        console.error('medicineContainer 不存在！');
        return;
    }
    if (!medicineA || !medicineB || !medicineC || !total) {
        console.error('配药界面元素缺失:', {
            medicineA: !!medicineA,
            medicineB: !!medicineB,
            medicineC: !!medicineC,
            total: !!total
        });
        return;
    }
    
    // 确保容器显示
    container.classList.remove('hidden');
    container.style.display = 'block';
    console.log('配药容器已显示');
    
    // 重置所有输入框为0
    medicineA.value = '0';
    medicineB.value = '0';
    medicineC.value = '0';
    total.textContent = '0';
    
    const updateTotal = () => {
        const a = parseInt(medicineA.value) || 0;
        const b = parseInt(medicineB.value) || 0;
        const c = parseInt(medicineC.value) || 0;
        const sum = a + b + c;
        total.textContent = sum;
    };
    
    medicineA.oninput = updateTotal;
    medicineB.oninput = updateTotal;
    medicineC.oninput = updateTotal;
    
    console.log('配药界面初始化完成');
}

function hidePuzzleModal() {
    const modal = document.getElementById('puzzleModal');
    if (modal) modal.classList.add('hidden');
    window.currentPuzzle = null;
    // 清理电箱连线状态
    if (window.electricBoxWiring) {
        window.electricBoxWiring = null;
    }
}

// 初始化电梯电箱连线游戏
function initElectricBoxWiring() {
    const container = document.getElementById('electricBoxWiringContainer');
    if (!container) {
        console.error('electricBoxWiringContainer 元素不存在！');
        return;
    }
    
    console.log('初始化电箱连线游戏，显示容器');
    // 确保容器显示
    container.classList.remove('hidden');
    container.style.display = 'block';
    container.style.visibility = 'visible';
    container.style.opacity = '1';
    
    // 初始化连线状态
    window.electricBoxWiring = {
        selectedLeft: null,
        connections: [], // [{left, right, line}]
        correctConnections: [
            {left: 0, right: 1}, // 红→蓝
            {left: 1, right: 0}, // 蓝→红
            {left: 2, right: 2}  // 绿→绿
        ]
    };
    
    // 清除所有连线
    const svg = document.getElementById('wiringSVG');
    if (svg) svg.innerHTML = '';
    
    // 重置所有点的样式
    for (let i = 1; i <= 3; i++) {
        const leftPoint = document.getElementById(`leftPoint${i}`);
        const rightPoint = document.getElementById(`rightPoint${i}`);
        if (leftPoint) {
            leftPoint.style.border = '4px solid white';
            leftPoint.style.transform = 'scale(1)';
        }
        if (rightPoint) {
            rightPoint.style.border = '4px solid white';
            rightPoint.style.transform = 'scale(1)';
        }
    }
    
    // 为左侧点添加点击事件
    for (let i = 1; i <= 3; i++) {
        const leftPoint = document.getElementById(`leftPoint${i}`);
        if (leftPoint) {
            leftPoint.onclick = () => selectLeftPoint(i - 1);
        }
    }
    
    // 为右侧点添加点击事件
    for (let i = 1; i <= 3; i++) {
        const rightPoint = document.getElementById(`rightPoint${i}`);
        if (rightPoint) {
            rightPoint.onclick = () => selectRightPoint(i - 1);
        }
    }
}

// 选择左侧点
function selectLeftPoint(index) {
    if (!window.electricBoxWiring) return;
    
    // 如果已经连接过这个点，先移除连接
    const existingConnection = window.electricBoxWiring.connections.find(c => c.left === index);
    if (existingConnection) {
        removeConnection(existingConnection);
    }
    
    // 选中左侧点
    window.electricBoxWiring.selectedLeft = index;
    
    // 更新样式
    for (let i = 1; i <= 3; i++) {
        const leftPoint = document.getElementById(`leftPoint${i}`);
        if (leftPoint) {
            if (i - 1 === index) {
                leftPoint.style.border = '4px solid yellow';
                leftPoint.style.transform = 'scale(1.2)';
            } else {
                leftPoint.style.border = '4px solid white';
                leftPoint.style.transform = 'scale(1)';
            }
        }
    }
}

// 选择右侧点
function selectRightPoint(index) {
    if (!window.electricBoxWiring || window.electricBoxWiring.selectedLeft === null) return;
    
    const leftIndex = window.electricBoxWiring.selectedLeft;
    
    // 如果已经连接过这个右侧点，先移除连接
    const existingConnection = window.electricBoxWiring.connections.find(c => c.right === index);
    if (existingConnection) {
        removeConnection(existingConnection);
    }
    
    // 创建连接
    createConnection(leftIndex, index);
    
    // 检查是否正确
    checkElectricBoxWiring();
    
    // 重置选中状态
    window.electricBoxWiring.selectedLeft = null;
    for (let i = 1; i <= 3; i++) {
        const leftPoint = document.getElementById(`leftPoint${i}`);
        if (leftPoint) {
            leftPoint.style.border = '4px solid white';
            leftPoint.style.transform = 'scale(1)';
        }
    }
}

// 创建连线
function createConnection(leftIndex, rightIndex) {
    if (!window.electricBoxWiring) return;
    
    const svg = document.getElementById('wiringSVG');
    if (!svg) return;
    
    // 获取点的位置
    const leftPoint = document.getElementById(`leftPoint${leftIndex + 1}`);
    const rightPoint = document.getElementById(`rightPoint${rightIndex + 1}`);
    if (!leftPoint || !rightPoint) return;
    
    const container = leftPoint.parentElement.parentElement;
    const containerRect = container.getBoundingClientRect();
    const leftRect = leftPoint.getBoundingClientRect();
    const rightRect = rightPoint.getBoundingClientRect();
    
    const x1 = leftRect.left + leftRect.width / 2 - containerRect.left;
    const y1 = leftRect.top + leftRect.height / 2 - containerRect.top;
    const x2 = rightRect.left + rightRect.width / 2 - containerRect.left;
    const y2 = rightRect.top + rightRect.height / 2 - containerRect.top;
    
    // 创建SVG线
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', '#3b82f6');
    line.setAttribute('stroke-width', '3');
    line.setAttribute('opacity', '0.8');
    
    svg.appendChild(line);
    
    // 保存连接
    window.electricBoxWiring.connections.push({
        left: leftIndex,
        right: rightIndex,
        line: line
    });
}

// 移除连接
function removeConnection(connection) {
    if (!window.electricBoxWiring) return;
    
    // 移除SVG线
    if (connection.line && connection.line.parentNode) {
        connection.line.parentNode.removeChild(connection.line);
    }
    
    // 从连接列表中移除
    const index = window.electricBoxWiring.connections.indexOf(connection);
    if (index > -1) {
        window.electricBoxWiring.connections.splice(index, 1);
    }
}

// 检查连线是否正确
function checkElectricBoxWiring() {
    if (!window.electricBoxWiring) return;
    
    // 如果连接了3条线，检查是否正确
    if (window.electricBoxWiring.connections.length === 3) {
        const correct = window.electricBoxWiring.correctConnections.every(correctConn => {
            return window.electricBoxWiring.connections.some(conn => 
                conn.left === correctConn.left && conn.right === correctConn.right
            );
        });
        
        if (correct) {
            // 全部正确
            setTimeout(() => {
                hidePuzzleModal();
                const puzzle = puzzles['electric_box_wiring'];
                if (puzzle && puzzle.onSolve) {
                    puzzle.onSolve();
                }
            }, 500);
        } else {
            // 有错误，触发失败结局
            setTimeout(() => {
                hidePuzzleModal();
                triggerWrongFloorEnding('接线错误');
            }, 500);
        }
    }
}

// 显示楼层分布弹窗（从医院大厅打开，显示完整信息）
function showFloorMapModal() {
    const modal = document.getElementById('floorMapModal');
    const input = document.getElementById('floorInput');
    const floor7Option = document.getElementById('floor7Option');
    const floorTitle = document.getElementById('floorMapTitle'); // 标题"各科室楼层分布"
    const floorListContainer = document.getElementById('floorListContainer'); // 楼层列表容器
    
    if (modal && input) {
        // 显示7楼选项
        if (floor7Option) {
            floor7Option.style.display = 'flex';
        }
        // 显示楼层分布标题和列表（从医院大厅打开时显示）
        if (floorTitle) {
            floorTitle.style.display = 'block';
        }
        if (floorListContainer) {
            floorListContainer.style.display = 'block';
        }
        input.setAttribute('max', '7');
        modal.classList.remove('hidden');
        input.value = '';
        input.focus();
    }
}

// 隐藏楼层分布弹窗
function hideFloorMapModal() {
    const modal = document.getElementById('floorMapModal');
    if (modal) modal.classList.add('hidden');
    
    // 恢复楼层分布标题和列表的显示（为下次打开做准备）
    const floorTitle = document.getElementById('floorMapTitle');
    const floorListContainer = document.getElementById('floorListContainer');
    if (floorTitle) {
        floorTitle.style.display = 'block';
    }
    if (floorListContainer) {
        floorListContainer.style.display = 'block';
    }
    
    // 确保回到医院大厅场景，恢复界面状态
    if (gameState.currentScene === 'corridor') {
        // 重新创建可交互元素，确保按钮正常显示
        setTimeout(() => {
            createObservables();
        }, 100);
    }
}

// 显示消防通道楼层选择弹窗
function showFireExitFloorModal() {
    // 如果正在执行2楼特殊流程，不允许打开弹窗
    if (gameState.isFloor2SequenceActive) {
        return;
    }
    
    const modal = document.getElementById('floorMapModal');
    const input = document.getElementById('floorInput');
    const floor7Option = document.getElementById('floor7Option');
    const floorTitle = document.getElementById('floorMapTitle'); // 标题"各科室楼层分布"
    const floorListContainer = document.getElementById('floorListContainer'); // 楼层列表容器
    
    if (modal && input) {
        // 隐藏7楼选项
        if (floor7Option) {
            floor7Option.style.display = 'none';
        }
        // 隐藏楼层分布标题和列表（从消防通道进入时不显示，让玩家自己记住）
        if (floorTitle) {
            floorTitle.style.display = 'none';
        }
        if (floorListContainer) {
            floorListContainer.style.display = 'none';
        }
        // 设置最大楼层为6
        input.setAttribute('max', '6');
        modal.classList.remove('hidden');
        input.value = '';
        input.focus();
    }
}

// 确认楼层选择
function confirmFloor() {
    const input = document.getElementById('floorInput');
    if (!input) return;
    
    const floor = input.value.trim();
    
    // 检查是否是从消防通道打开的（通过检查input的max属性）
    const isFromFireExit = input.getAttribute('max') === '6';
    
    if (floor === '7') {
        // 如果是从消防通道打开的，不允许选择7楼
        if (isFromFireExit) {
            showDescription('请输入有效的楼层数字（2-6楼）。');
            input.style.borderColor = '#ef4444';
            setTimeout(() => {
                input.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }, 1000);
            return;
        }
        hideFloorMapModal();
        // 立即清除按钮，防止误触
        clearObservables();
        showDescription('你选择了7楼护理部，决定走楼梯上去。');
        // 隐藏电梯和科室分布按钮
        hideFloorButtons();
        // 显示病房选择界面
        setTimeout(() => {
            showRoomSelectionModal();
        }, 1500);
    } else if (floor && parseInt(floor) >= 2 && parseInt(floor) <= 6) {
        // 如果是从消防通道打开的
        if (isFromFireExit) {
            hideFloorMapModal();
            // 立即清除按钮，防止误触
            clearObservables();
            // 标记消防通道已使用，这样按钮会消失
            gameState.fireExitUsed = true;
            
            if (floor === '6') {
                // 选择6楼（手术室），进入手术室场景
                gameState.unlockRoom('operating');
                // 解锁手术室场景（绕过谜题要求）
                const operatingScene = gameData.scenes['operating'];
                if (operatingScene) {
                    operatingScene.locked = false;
                    operatingScene.requiredPuzzle = null; // 清除谜题要求
                }
                showDescription(`你选择了${floor}楼手术室，从消防通道离开了。`);
                // 进入手术室场景
                setTimeout(() => {
                    changeScene('operating');
                }, 1500);
            } else if (floor === '2' && gameState.hasCorrectNursingRecord) {
                // 如果收集到正确的护理记录并选择了2楼，触发特殊流程
                // 检查是否已经触发过特殊流程，如果已经触发过则不再触发
                console.log('选择2楼，检查状态:', {
                    floor2SequenceTriggered: gameState.floor2SequenceTriggered,
                    isFloor2SequenceActive: gameState.isFloor2SequenceActive,
                    hasCorrectNursingRecord: gameState.hasCorrectNursingRecord,
                    key203Obtained: gameState.key203Obtained,
                    hasElevatorCard: gameState.hasElevatorCard,
                    hasVisitedArchive: gameState.unlockedRooms.has('archive')
                });
                
                // 检查游戏进度是否已经超过音频阶段
                // 如果已经到达过电工房、获得203钥匙或获得电梯卡，说明已经完成过2楼特殊流程
                const hasProgressedBeyondAudio = gameState.floor2SequenceTriggered || 
                                                 gameState.unlockedRooms.has('archive') || 
                                                 gameState.key203Obtained || 
                                                 gameState.hasElevatorCard;
                
                if (hasProgressedBeyondAudio) {
                    // 已经触发过或游戏进度已超过音频阶段
                    // 检查是否从电工房（archive场景）进入
                    const previousScene = gameState.currentScene;
                    if (previousScene === 'archive') {
                        // 从电工房进入2楼，使用特殊流程
                        console.log('从电工房进入2楼，使用特殊流程');
                        hideFloorMapModal();
                        clearObservables();
                        gameState.fireExitUsed = true;
                        gameState.unlockRoom('floor_2');
                        // 直接进入2楼场景，显示特殊描述和按钮
                        handleFloor2FromArchive();
                        return;
                    }
                    // 其他情况，直接进入2楼场景，不播放音频
                    console.log('游戏进度已超过音频阶段，跳过音频播放，直接进入2楼场景');
                    // 确保标记已设置，防止后续再次触发
                    if (!gameState.floor2SequenceTriggered) {
                        gameState.floor2SequenceTriggered = true;
                    }
                    hideFloorMapModal();
                    clearObservables();
                    gameState.fireExitUsed = true;
                    gameState.unlockRoom('floor_2');
                    changeScene('floor_2');
                    // 显示选择按钮
                    setTimeout(() => {
                        showFloor2ChoiceButtons();
                    }, 500);
                    return;
                }
                // 检查是否已经在执行特殊流程，防止重复触发
                if (gameState.isFloor2SequenceActive) {
                    console.log('2楼特殊流程正在进行中，忽略重复触发');
                    return;
                }
                console.log('首次触发2楼特殊流程，开始播放音频');
                hideFloorMapModal();
                clearObservables();
                gameState.fireExitUsed = true;
                gameState.isFloor2SequenceActive = true; // 标记特殊流程已开始
                // 不显示"你选择了2楼"的描述，直接进入特殊流程
                handleFloor2SpecialSequence();
            } else if (floor === '4' && gameState.operatingRoomWrongClickedAreas.length >= 1) {
                // 如果点击了错误区域并选择了4楼，显示401房间选择界面
                showDescription('你选择了4楼，从消防通道离开...');
                setTimeout(() => {
                    showRoom401SelectionModal();
                }, 1500);
            } else {
                // 选择2-5楼（除了2楼且收集到正确护理记录、4楼且点击了错误区域的情况），触发失败结局
                hideFloorButtons();
                showDescription(`你选择了${floor}楼，从消防通道离开...`);
                setTimeout(() => {
                    triggerWrongFloorEnding(floor);
                }, 2000);
            }
        } else {
            // 不是从消防通道打开的，触发失败结局
            hideFloorMapModal();
            // 立即清除按钮，防止误触
            clearObservables();
            hideFloorButtons();
            showDescription(`你选择了${floor}楼，决定走楼梯上去...`);
            setTimeout(() => {
                triggerWrongFloorEnding(floor);
            }, 2000);
        }
    } else {
        // 根据是否从消防通道打开显示不同的提示
        const isFromFireExit = input.getAttribute('max') === '6';
        const maxFloor = isFromFireExit ? '6' : '7';
        showDescription(`请输入有效的楼层数字（2-${maxFloor}楼）。`);
        input.style.borderColor = '#ef4444';
        setTimeout(() => {
            input.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        }, 1000);
    }
}

// 隐藏楼层相关按钮
function hideFloorButtons() {
    const container = document.getElementById('choicesContainer');
    if (!container) return;
    
    // 找到电梯和科室分布按钮并移除
    const buttons = container.querySelectorAll('.choice-button');
    buttons.forEach(button => {
        const text = button.textContent.trim();
        if (text === '电梯' || text === '各科室楼层分布') {
            button.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
            button.style.opacity = '0';
            button.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                button.remove();
            }, 500);
        }
    });
}

// 显示病房选择弹窗
function showRoomSelectionModal() {
    const modal = document.getElementById('roomSelectionModal');
    const roomGrid = modal?.querySelector('.grid');
    const roomInput = document.getElementById('roomInput');
    const inputContainer = roomInput?.parentElement; // 输入框的父容器
    const confirmButton = document.getElementById('confirmRoom');
    const cancelButton = document.getElementById('cancelRoom');
    const buttonContainer = confirmButton?.parentElement; // 按钮的父容器
    
    if (!modal || !roomGrid) return;
    
    // 显示输入框部分（恢复显示）
    if (inputContainer) {
        inputContainer.style.display = 'block';
    }
    
    // 显示确认和取消按钮（恢复显示）
    if (buttonContainer) {
        buttonContainer.style.display = 'flex';
    }
    
    // 生成701-720的病房按钮
    roomGrid.innerHTML = '';
    for (let i = 701; i <= 720; i++) {
        const button = document.createElement('button');
        button.className = 'room-button p-3 rounded-lg text-white text-sm font-medium';
        button.textContent = i;
        button.onclick = () => {
            selectRoom(i.toString());
        };
        roomGrid.appendChild(button);
    }
    
    if (roomInput) roomInput.value = '';
    modal.classList.remove('hidden');
}

// 隐藏病房选择弹窗
function hideRoomSelectionModal() {
    const modal = document.getElementById('roomSelectionModal');
    if (modal) modal.classList.add('hidden');
}

// 显示401房间选择弹窗
function showRoom401SelectionModal() {
    const modal = document.getElementById('roomSelectionModal');
    const roomGrid = modal?.querySelector('.grid');
    const roomInput = document.getElementById('roomInput');
    const inputContainer = roomInput?.parentElement; // 输入框的父容器
    const confirmButton = document.getElementById('confirmRoom');
    const cancelButton = document.getElementById('cancelRoom');
    const buttonContainer = confirmButton?.parentElement; // 按钮的父容器
    const modalTitle = modal?.querySelector('h3');
    const modalDesc = modal?.querySelector('p');
    
    if (!modal || !roomGrid) return;
    
    // 修改标题和描述
    if (modalTitle) modalTitle.textContent = '4楼 - 选择病房';
    if (modalDesc) modalDesc.textContent = '你来到了4楼，护理记录显示患者已转移至401号房间。你要进入哪个房间？';
    
    // 隐藏输入框部分
    if (inputContainer) {
        inputContainer.style.display = 'none';
    }
    
    // 隐藏确认和取消按钮
    if (buttonContainer) {
        buttonContainer.style.display = 'none';
    }
    
    // 只生成401房间按钮
    roomGrid.innerHTML = '';
    const button = document.createElement('button');
    button.className = 'room-button p-3 rounded-lg text-white text-sm font-medium bg-red-600 hover:bg-red-700';
    button.textContent = '401';
    button.onclick = () => {
        selectRoom401();
    };
    roomGrid.appendChild(button);
    
    modal.classList.remove('hidden');
}

// 选择401房间（触发失败结局）
function selectRoom401() {
    hideRoomSelectionModal();
    clearObservables();
    // 不在这里显示描述，让triggerWrongFloorEnding统一处理
    setTimeout(() => {
        triggerWrongFloorEnding('4楼401');
    }, 500);
}

// 选择房间
function selectRoom(roomNumber) {
    const roomNum = parseInt(roomNumber);
    if (roomNum >= 701 && roomNum <= 720) {
        hideRoomSelectionModal();
        // 立即清除按钮，防止误触
        clearObservables();
        // 如果选择717房间，进入717房间场景；其他房间暂时也进入717场景
        if (roomNum === 717) {
            gameState.unlockRoom('room_717');
            showDescription(`你进入了${roomNumber}号病房。`);
            gameState.updateMapStatus();
            setTimeout(() => {
                changeScene('room_717');
            }, 1000);
        } else {
            // 其他房间暂时也进入717场景（可根据需要扩展）
            gameState.unlockRoom('room_717');
            showDescription(`你进入了${roomNumber}号病房。`);
            gameState.updateMapStatus();
            setTimeout(() => {
                changeScene('room_717');
            }, 1000);
        }
    }
}

// 确认房间选择（从输入框）
function confirmRoom() {
    const input = document.getElementById('roomInput');
    if (!input) return;
    
    const roomNumber = input.value.trim();
    const roomNum = parseInt(roomNumber);
    
    // 检查是否是401房间（误导护理记录的情况）
    if (roomNum === 401 && gameState.operatingRoomWrongClickedAreas.length >= 1) {
        selectRoom401();
        return;
    }
    
    if (roomNum >= 701 && roomNum <= 720) {
        selectRoom(roomNumber);
    } else {
        const minRoom = input.getAttribute('min') || '701';
        const maxRoom = input.getAttribute('max') || '720';
        showDescription(`请输入有效的房间号（${minRoom}-${maxRoom}）。`);
        input.style.borderColor = '#ef4444';
        setTimeout(() => {
            input.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        }, 1000);
    }
}

// 触发选错楼层的失败结局
function triggerWrongFloorEnding(floor) {
    // 失败时保存存档
    // 如果是在2楼选择按钮环节失败的（currentScene是floor_2），保存为floor_2场景
    // 否则保存为当前场景
    const previousScene = gameState.currentScene;
    // 如果是在2楼选择环节失败的，保持为floor_2场景
    if (previousScene === 'floor_2' && gameState.hasCorrectNursingRecord) {
        // 保持在floor_2场景，这样加载后可以显示选择按钮
        gameState.currentScene = 'floor_2';
    } else {
        // 其他情况，保存为手术室场景（因为通常是从手术室出发的）
        gameState.currentScene = 'operating';
    }
    saveGameForFailure();
    // 恢复场景（用于显示失败描述）
    gameState.currentScene = previousScene;
    
    showDescription(`你步行到了${floor}...这里似乎有什么不对劲...`);
    
    // 快速黑屏
    setTimeout(() => {
        const darkOverlay = document.createElement('div');
        darkOverlay.id = 'wrongFloorDarkOverlay';
        darkOverlay.className = 'fixed inset-0 bg-black z-50';
        darkOverlay.style.opacity = '0';
        darkOverlay.style.transition = 'opacity 0.3s ease-in';
        document.body.appendChild(darkOverlay);
        
        // 快速变黑
        setTimeout(() => {
            darkOverlay.style.opacity = '1';
        }, 50);
        
        // 鲜血从屏幕顶上流下 - 改进的液体效果
        setTimeout(() => {
            const bloodContainer = document.createElement('div');
            bloodContainer.id = 'bloodContainer';
            bloodContainer.className = 'fixed inset-0 z-50 pointer-events-none';
            bloodContainer.style.overflow = 'hidden';
            document.body.appendChild(bloodContainer);
            
            // 创建多条血痕，每条都有随机宽度和位置
            const streamCount = 10; // 增加血痕数量
            for (let i = 0; i < streamCount; i++) {
                // 随机位置和宽度，让效果更自然
                const leftPosition = 5 + (i * (90 / streamCount)) + (Math.random() * 5 - 2.5);
                const streamWidth = 4 + Math.random() * 6; // 4-10px宽度
                const streamSpeed = 1.8 + Math.random() * 0.6; // 1.8-2.4秒
                
                // 主血流
                const bloodStream = document.createElement('div');
                bloodStream.className = 'blood-stream';
                bloodStream.style.left = `${leftPosition}%`;
                bloodStream.style.width = `${streamWidth}px`;
                bloodStream.style.height = '0';
                bloodStream.style.transition = `height ${streamSpeed}s ease-out`;
                bloodStream.style.opacity = '0.95';
                
                bloodContainer.appendChild(bloodStream);
                
                // 添加一些随机的小血滴
                const dropCount = 2 + Math.floor(Math.random() * 3); // 每条血流2-4个小血滴
                for (let j = 0; j < dropCount; j++) {
                    const bloodDrip = document.createElement('div');
                    bloodDrip.className = 'blood-drip';
                    const dripLeft = leftPosition + (Math.random() * 2 - 1);
                    const dripSize = 3 + Math.random() * 4;
                    const dripDelay = Math.random() * 0.5;
                    const dripSpeed = streamSpeed + 0.3 + Math.random() * 0.4;
                    
                    bloodDrip.style.left = `${dripLeft}%`;
                    bloodDrip.style.width = `${dripSize}px`;
                    bloodDrip.style.height = '0';
                    bloodDrip.style.transition = `height ${dripSpeed}s ease-out ${dripDelay}s`;
                    bloodDrip.style.opacity = '0.85';
                    
                    bloodContainer.appendChild(bloodDrip);
                    
                    // 启动血滴动画
                    setTimeout(() => {
                        bloodDrip.style.height = '100vh';
                    }, i * 100 + j * 50);
                }
                
                // 延迟启动每条血痕，让它们不同步
                setTimeout(() => {
                    bloodStream.style.height = '110vh'; // 稍微超出屏幕，确保完全覆盖
                    
                    // 在血流到达底部时添加飞溅效果
                    setTimeout(() => {
                        for (let k = 0; k < 3; k++) {
                            const splash = document.createElement('div');
                            splash.className = 'blood-splash';
                            const splashLeft = leftPosition + (Math.random() * 4 - 2);
                            splash.style.left = `${splashLeft}%`;
                            splash.style.bottom = '0';
                            splash.style.animationDelay = `${k * 0.1}s`;
                            bloodContainer.appendChild(splash);
                            
                            // 3秒后移除飞溅效果
                            setTimeout(() => {
                                if (splash.parentNode) {
                                    splash.remove();
                                }
                            }, 3000);
                        }
                    }, streamSpeed * 1000);
                }, i * 120 + Math.random() * 100);
            }
            
            // 显示最终文字
            setTimeout(() => {
                const message = document.createElement('div');
                message.className = 'fixed inset-0 flex items-center justify-center z-50';
                message.style.opacity = '0';
                message.style.transition = 'opacity 1s ease-in-out';
                message.innerHTML = `
                    <div class="text-center text-white">
                        <h2 class="text-5xl font-bold mb-4 text-red-600 drop-shadow-2xl">周侦探永远留在了城郊医院</h2>
                        <button onclick="restartGame()" class="mt-12 bg-gray-800 hover:bg-gray-700 px-8 py-3 rounded-lg font-medium transition-colors">
                            重新开始
                        </button>
                    </div>
                `;
                document.body.appendChild(message);
                setTimeout(() => {
                    message.style.opacity = '1';
                }, 100);
            }, 2500);
        }, 500);
    }, 1500);
}

function confirmPuzzle() {
    const puzzleId = window.currentPuzzle;
    if (!puzzleId) return;
    
    const puzzle = puzzles[puzzleId];
    if (!puzzle) return;
    
    let answer = '';
    
    // 配药谜题：从medicineA获取答案
    if (puzzleId === 'medicine_mix') {
        const medicineA = document.getElementById('medicineA');
        if (medicineA) {
            answer = medicineA.value.trim();
        }
    } else {
        // 其他谜题：从puzzleInput获取答案
        const input = document.getElementById('puzzleInput');
        if (!input) return;
        answer = input.value.trim();
    }
    
    // 比较答案（忽略空格）
    const normalizedAnswer = answer.replace(/\s+/g, '');
    const normalizedSolution = puzzle.solution.replace(/\s+/g, '');
    
    // 对于包含英文字母的答案，忽略大小写比较；对于纯中文，精确比较
    const containsLetters = /[A-Za-z]/.test(normalizedSolution);
    const answerToCompare = containsLetters ? normalizedAnswer.toUpperCase() : normalizedAnswer;
    const solutionToCompare = containsLetters ? normalizedSolution.toUpperCase() : normalizedSolution;
    
    if (answerToCompare === solutionToCompare) {
        if (gameState.solvePuzzle(puzzleId)) {
            // 解谜成功，不再自动保存（只在失败时保存）
            hidePuzzleModal();
            if (puzzle.onSolve) puzzle.onSolve();
            createObservables();
        }
    } else {
        // 显示错误提示
        if (puzzleId === 'medicine_mix') {
            const medicineA = document.getElementById('medicineA');
            if (medicineA) {
                medicineA.style.borderColor = '#ef4444';
                medicineA.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    medicineA.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    medicineA.style.animation = '';
                }, 500);
            }
        } else {
            const input = document.getElementById('puzzleInput');
            if (input) {
                input.style.borderColor = '#ef4444';
                input.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    input.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    input.style.animation = '';
                }, 500);
            }
        }
        gameState.increaseDetectionRisk(3);
    }
}

function triggerFailureEnding() {
    // 失败时保存存档，以便可以从当前场景继续
    saveGameForFailure();
    
    const screen = document.getElementById('failureScreen');
    const overlay = document.getElementById('darkOverlay');
    const cutLeft = document.getElementById('cutLeft');
    const cutRight = document.getElementById('cutRight');
    const message = document.getElementById('failureMessage');
    
    if (screen) screen.classList.remove('hidden');
    setTimeout(() => { if (overlay) overlay.style.opacity = '1'; }, 100);
    setTimeout(() => {
        if (cutLeft) cutLeft.style.transform = 'translateX(0)';
        if (cutRight) cutRight.style.transform = 'translateX(0)';
    }, 3200);
    setTimeout(() => { if (message) message.style.opacity = '1'; }, 4200);
}

function checkEnding() {
    if (gameState.solvedPuzzles.length >= gameState.gameProgress.totalPuzzles) {
        const endingScreen = document.getElementById('endingScreen');
        const title = document.getElementById('endingTitle');
        const desc = document.getElementById('endingDescription');
        if (endingScreen && title && desc) {
            title.textContent = '真相揭露';
            desc.textContent = '你成功解决了所有谜题，揭露了城郊医院的非法人体实验。证据确凿，警方立即采取行动。陈院长被逮捕，所有参与实验的人员都被绳之以法。正义最终得到了伸张。';
            endingScreen.classList.remove('hidden');
        }
    }
}

function restartGame() {
    // 清理所有失败结局的UI元素
    cleanupFailureUI();
    
    // 跳转到start.html，让玩家选择存档或开始新游戏
    window.location.href = 'start.html';
}

// 清理失败结局的UI元素
function cleanupFailureUI() {
    // 隐藏所有结局屏幕
    const endingScreen = document.getElementById('endingScreen');
    const failureScreen = document.getElementById('failureScreen');
    if (endingScreen) endingScreen.classList.add('hidden');
    if (failureScreen) failureScreen.classList.add('hidden');
    
    // 清理选错楼层的失败结局元素
    const wrongFloorDarkOverlay = document.getElementById('wrongFloorDarkOverlay');
    const bloodContainer = document.getElementById('bloodContainer');
    const shadowFigure = document.getElementById('shadowFigure');
    const shadowPerson = document.getElementById('shadowPerson');
    
    if (wrongFloorDarkOverlay) wrongFloorDarkOverlay.remove();
    if (bloodContainer) bloodContainer.remove();
    if (shadowFigure) {
        shadowFigure.classList.add('hidden');
    }
    if (shadowPerson) {
        shadowPerson.style.opacity = '0';
        shadowPerson.style.transform = 'translate(-50%, 0) scale(0.5)';
        shadowPerson.style.transition = '';
    }
    
    // 移除所有动态创建的失败结局消息
    const failureMessages = document.querySelectorAll('[class*="fixed inset-0 flex items-center justify-center z-50"]');
    failureMessages.forEach(msg => {
        if (msg.textContent.includes('周侦探永远留在了城郊医院')) {
            msg.remove();
        }
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hidePuzzleModal();
        hideFloorMapModal();
        closeMapModal();
        hideUndergroundPasswordModal();
        hideBasementComputerPasswordModal();
    }
    if (e.key === 'Enter') {
        const puzzleModal = document.getElementById('puzzleModal');
        const floorModal = document.getElementById('floorMapModal');
        const undergroundPasswordModal = document.getElementById('undergroundPasswordModal');
        const basementComputerPasswordModal = document.getElementById('basementComputerPasswordModal');
        if (puzzleModal && !puzzleModal.classList.contains('hidden')) {
            confirmPuzzle();
        }
        if (floorModal && !floorModal.classList.contains('hidden')) {
            confirmFloor();
        }
        if (undergroundPasswordModal && !undergroundPasswordModal.classList.contains('hidden')) {
            confirmUndergroundPassword();
        }
        if (basementComputerPasswordModal && !basementComputerPasswordModal.classList.contains('hidden')) {
            confirmBasementComputerPassword();
        }
    }
});

document.addEventListener('DOMContentLoaded', initGame);

// 页面卸载时清除存档（正常退出时清除，失败后的恢复由restartGame处理）
window.addEventListener('beforeunload', () => {
    // 清除存档，下次进入游戏时从初始状态开始
    clearSave();
});
