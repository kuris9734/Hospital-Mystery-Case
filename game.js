// 游戏状态管理
class GameState {
    constructor() {
        this.currentScene = 'corridor';
        this.currentCharacter = null;
        this.dialogueIndex = 0;
        this.collectedClues = [];
        this.gameProgress = {
            cluesFound: 0,
            scenesExplored: 1,
            currentObjective: '调查医院走廊，寻找可疑线索'
        };
        this.visitedScenes = new Set(['corridor']);
        this.characterRelationships = {};
        this.puzzleStates = {
            operatingRoomCode: false,
            directorOfficeUnlocked: false,
            undergroundAccess: false
        };
        this.endings = {
            truthRevealed: false,
            missing: false,
            escape: false
        };
    }

    addClue(clue) {
        if (!this.collectedClues.find(c => c.id === clue.id)) {
            this.collectedClues.push(clue);
            this.gameProgress.cluesFound++;
            this.updateProgress();
            this.showClueNotification(clue);
        }
    }

    updateProgress() {
        document.getElementById('clueProgress').textContent = `${this.gameProgress.cluesFound}/15`;
        document.getElementById('clueProgressBar').style.width = `${(this.gameProgress.cluesFound / 15) * 100}%`;
        document.getElementById('sceneProgress').textContent = `${this.gameProgress.scenesExplored}/7`;
        document.getElementById('sceneProgressBar').style.width = `${(this.gameProgress.scenesExplored / 7) * 100}%`;
        document.getElementById('currentObjective').textContent = this.gameProgress.currentObjective;
    }

    showClueNotification(clue) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <span class="text-xl">🔍</span>
                <div>
                    <div class="font-bold">发现新线索！</div>
                    <div class="text-sm">${clue.name}</div>
                </div>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// 游戏数据
const gameData = {
    scenes: {
        corridor: {
            name: '医院走廊',
            background: 'scene_hospital_corridor.png',
            description: '昏暗的医院走廊，灯光时亮时灭...',
            hotspots: [
                {
                    id: 'id_card',
                    x: 65,
                    y: 70,
                    width: 8,
                    height: 5,
                    clue: {
                        id: 'elevator_card',
                        name: '电梯卡',
                        description: '一张损坏的电梯卡，上面印着"B1"字样',
                        icon: '📋'
                    },
                    action: () => {
                        gameState.addClue({
                            id: 'elevator_card',
                            name: '损坏的电梯卡',
                            description: '一张在走廊发现的电梯卡，似乎可以通往地下一层',
                            icon: '📋'
                        });
                        updateCluesList();
                    }
                },
                {
                    id: 'footprints',
                    x: 30,
                    y: 80,
                    width: 15,
                    height: 8,
                    action: () => {
                        showDialogue('这些脚印看起来很奇怪...不像是普通的鞋子留下的。', 'investigator');
                        gameState.addClue({
                            id: 'strange_footprints',
                            name: '奇怪脚印',
                            description: '走廊上发现的神秘脚印，可能来自手术室的专用鞋',
                            icon: '👣'
                        });
                        updateCluesList();
                    }
                },
                {
                    id: 'nurses_station',
                    x: 80,
                    y: 40,
                    width: 15,
                    height: 20,
                    character: 'ting_nurse',
                    action: () => {
                        meetCharacter('ting_nurse');
                    }
                }
            ]
        },
        operating: {
            name: '手术室',
            background: 'scene_operating_room.png',
            description: '充满神秘气氛的手术室...',
            locked: true,
            requiredClue: 'elevator_card',
            hotspots: [
                {
                    id: 'medical_chart',
                    x: 20,
                    y: 60,
                    width: 10,
                    height: 8,
                    action: () => {
                        showDialogue('这是两天前的手术记录...日期似乎被修改过。', 'investigator');
                        gameState.addClue({
                            id: 'altered_surgery_log',
                            name: '被修改的手术记录',
                            description: '手术日期被人为修改过，可能隐藏着什么秘密',
                            icon: '📄'
                        });
                        updateCluesList();
                    }
                },
                {
                    id: 'hidden_recorder',
                    x: 75,
                    y: 45,
                    width: 5,
                    height: 5,
                    action: () => {
                        showPasswordModal('2471', () => {
                            showDialogue('录音器里传来了神秘的声音...', 'investigator');
                            gameState.addClue({
                                id: 'mysterious_recording',
                                name: '神秘录音',
                                description: '录音器中的内容暗示着医院地下室的秘密',
                                icon: '🎙️'
                            });
                            gameState.puzzleStates.operatingRoomCode = true;
                            updateCluesList();
                        });
                    }
                },
                {
                    id: 'blood_stains',
                    x: 50,
                    y: 70,
                    width: 12,
                    height: 6,
                    action: () => {
                        showDialogue('这些血迹...看起来很新鲜。', 'investigator');
                        gameState.addClue({
                            id: 'fresh_blood',
                            name: '新鲜血迹',
                            description: '手术台上的血迹看起来很新鲜，说明最近有人在这里',
                            icon: '🩸'
                        });
                        updateCluesList();
                    }
                }
            ]
        },
        ward: {
            name: '住院部三层',
            background: 'scene_ward_third_floor.png',
            description: '部分病房被封锁的住院部...',
            hotspots: [
                {
                    id: 'patient_x_room',
                    x: 25,
                    y: 50,
                    width: 15,
                    height: 25,
                    character: 'patient_x',
                    action: () => {
                        meetCharacter('patient_x');
                    }
                },
                {
                    id: 'map_fragment',
                    x: 70,
                    y: 85,
                    width: 8,
                    height: 5,
                    action: () => {
                        showDialogue('这是地图的一部分...看起来是地下室的布局，让我仔细研究！', 'investigator');
                        setTimeout(() => {
                            window.open('basement_clues.html', '_blank');
                        }, 1500);
                        gameState.addClue({
                            id: 'basement_map_fragment',
                            name: '地下室地图碎片',
                            description: '婷护士留下的地图碎片，显示了地下实验室的位置',
                            icon: '🗺️'
                        });
                        updateCluesList();
                    }
                },
                {
                    id: 'sealed_rooms',
                    x: 60,
                    y: 40,
                    width: 20,
                    height: 30,
                    action: () => {
                        showDialogue('这些房间被封锁了...里面似乎隐藏着什么。', 'investigator');
                        gameState.addClue({
                            id: 'sealed_rooms_evidence',
                            name: '封锁病房的证据',
                            description: '多个病房被异常封锁，可能与实验有关',
                            icon: '🔒'
                        });
                        updateCluesList();
                    }
                }
            ]
        },
        director: {
            name: '院长室',
            background: 'scene_director_office.png',
            description: '院长陈橘子的办公室...',
            locked: true,
            requiredClue: 'altered_surgery_log',
            hotspots: [
                {
                    id: 'locked_filing_cabinet',
                    x: 80,
                    y: 60,
                    width: 12,
                    height: 25,
                    action: () => {
                        showPasswordModal('1225', () => {
                            showDialogue('文件柜里发现了秘密实验的批准文件...', 'investigator');
                            gameState.addClue({
                                id: 'experiment_approval',
                                name: '实验批准文件',
                                description: '院长批准的秘密人体实验文件，涉及多名失踪患者',
                                icon: '📋'
                            });
                            gameState.puzzleStates.directorOfficeUnlocked = true;
                            updateCluesList();
                        });
                    }
                },
                {
                    id: 'desk_photo',
                    x: 45,
                    y: 65,
                    width: 8,
                    height: 10,
                    action: () => {
                        showDialogue('照片上是院长和一群穿白大褂的人...背景看起来像实验室。', 'investigator');
                        gameState.addClue({
                            id: 'suspicious_photo',
                            name: '可疑照片',
                            description: '院长与未知研究团队的合影，背景疑似秘密实验室',
                            icon: '📸'
                        });
                        updateCluesList();
                    }
                },
                {
                    id: 'medical_books',
                    x: 15,
                    y: 30,
                    width: 20,
                    height: 40,
                    action: () => {
                        showDialogue('这些医学书籍...都是关于人体实验的。', 'investigator');
                        gameState.addClue({
                            id: 'experimental_medical_books',
                            name: '实验医学书籍',
                            description: '大量关于人体实验的专业书籍，暗示院长的真实目的',
                            icon: '📚'
                        });
                        updateCluesList();
                    }
                }
            ]
        },
        monitor: {
            name: '监控室',
            background: 'scene_monitoring_room.png',
            description: '医院的监控中心...',
            hotspots: [
                {
                    id: 'security_guard',
                    x: 70,
                    y: 60,
                    width: 15,
                    height: 25,
                    character: 'security_guard',
                    action: () => {
                        meetCharacter('security_guard');
                    }
                },
                {
                    id: 'monitor_logs',
                    x: 30,
                    y: 40,
                    width: 25,
                    height: 15,
                    action: () => {
                        showDialogue('监控日志显示...凌晨2:13分手术室竟然有灯光？让我详细查看这些记录...', 'investigator');
                        setTimeout(() => {
                            window.open('monitor_clues.html', '_blank');
                        }, 1500);
                        gameState.addClue({
                            id: 'suspicious_monitor_logs',
                            name: '可疑的监控记录',
                            description: '监控显示深夜手术室有异常活动，与手术记录不符',
                            icon: '📹'
                        });
                        updateCluesList();
                    }
                },
                {
                    id: 'time_sheets',
                    x: 10,
                    y: 70,
                    width: 12,
                    height: 8,
                    action: () => {
                        showDialogue('值班表显示...有些员工的出勤记录被篡改了。', 'investigator');
                        gameState.addClue({
                            id: 'altered_attendance',
                            name: '被修改的值班记录',
                            description: '员工出勤记录被人为修改，可能为了掩盖某些人的行踪',
                            icon: '⏰'
                        });
                        updateCluesList();
                    }
                }
            ]
        },
        underground: {
            name: '地下电梯通道',
            background: 'scene_underground_elevator.png',
            description: '封锁的地下通道...',
            locked: true,
            requiredClues: ['basement_map_fragment', 'mysterious_recording'],
            hotspots: [
                {
                    id: 'elevator_door',
                    x: 50,
                    y: 60,
                    width: 20,
                    height: 30,
                    action: () => {
                        if (gameState.collectedClues.find(c => c.id === 'elevator_card')) {
                            showDialogue('电梯卡起作用了...地下室的门开了。', 'investigator');
                            gameState.puzzleStates.undergroundAccess = true;
                            changeScene('archive');
                        } else {
                            showDialogue('需要电梯卡才能进入...', 'investigator');
                        }
                    }
                }
            ]
        },
        archive: {
            name: '实验档案室',
            background: 'scene_experimental_archive.png',
            description: '隐藏的秘密实验室...',
            hotspots: [
                {
                    id: 'experimental_files',
                    x: 30,
                    y: 40,
                    width: 20,
                    height: 30,
                    action: () => {
                        showDialogue('这些文件记录了可怕的人体实验...让我仔细查看这些档案！', 'investigator');
                        setTimeout(() => {
                            window.open('experiment_clues.html', '_blank');
                        }, 1500);
                        gameState.addClue({
                            id: 'human_experiment_evidence',
                            name: '人体实验证据',
                            description: '完整的实验记录，证明了医院的非法人体实验活动',
                            icon: '🧪'
                        });
                        updateCluesList();
                        checkEnding();
                    }
                },
                {
                    id: 'missing_patients_list',
                    x: 60,
                    y: 50,
                    width: 15,
                    height: 20,
                    action: () => {
                        showDialogue('失踪患者名单...婷护士的名字也在上面！', 'investigator');
                        gameState.addClue({
                            id: 'missing_patients_evidence',
                            name: '失踪患者名单',
                            description: '记录了所有失踪患者的详细信息，包括婷护士',
                            icon: '📋'
                        });
                        updateCluesList();
                        checkEnding();
                    }
                },
                {
                    id: 'director_chen_appearance',
                    x: 80,
                    y: 30,
                    width: 15,
                    height: 25,
                    character: 'chen_juzi',
                    action: () => {
                        meetCharacter('chen_juzi');
                    }
                }
            ]
        }
    },
    
    characters: {
        chen_juzi: {
            name: '陈橘子',
            title: '院长',
            portrait: 'character_chen_juzi_new.png',
            dialogue: [
                '你终于来了...我等你很久了。',
                '你以为你在调查什么？一些简单的医疗事故吗？',
                '这个世界需要进步，而进步总是需要牺牲的。',
                '婷护士？她太天真了，以为每个人都能被拯救。',
                '现在你知道了真相...但你认为你能离开这里吗？'
            ]
        },
        ting_nurse: {
            name: '婷护士',
            title: '失踪护士',
            portrait: 'character_ting_nurse_new.png',
            dialogue: [
                '请帮帮我...他们正在做一些可怕的事情。',
                '院长她...她不是你以为的那种人。',
                '地下室...他们把人带到地下室...',
                '这张地图很重要，它会指引你找到真相。',
                '小心陈院长，她比任何人都要危险。'
            ]
        },
        security_guard: {
            name: '安保人员A',
            title: '夜班保安',
            portrait: 'character_security_guard_new.png',
            dialogue: [
                '这地方...晚上不太平。',
                '我见过一些东西...但你不会相信的。',
                '监控有时候会出现奇怪的干扰。',
                '凌晨两点左右，手术室会有灯光...但那里应该没人。',
                '我建议你白天来调查，晚上这里...不安全。'
            ]
        },
        patient_x: {
            name: '患者X',
            title: '长期住院患者',
            portrait: 'character_patient_x_new.png',
            dialogue: [
                '楼下...楼下有人醒来...',
                '他们带走了很多人...再也没有回来。',
                '婷护士是个好人...她想要帮助我们。',
                '地下室有声音...惨叫声...',
                '你也快要被带走了吗？'
            ]
        },
        investigator: {
            name: '调查员',
            title: '你',
            portrait: '',
            dialogue: []
        }
    }
};

// 全局游戏状态
let gameState = new GameState();

// 初始化游戏
function initGame() {
    updateCluesList();
    gameState.updateProgress();
    setupEventListeners();
    changeScene('corridor');
}

// 设置事件监听器
function setupEventListeners() {
    document.getElementById('inventoryBtn').addEventListener('click', toggleInventory);
    document.getElementById('mapBtn').addEventListener('click', showMapModal);
    document.getElementById('saveBtn').addEventListener('click', saveGame);
    document.getElementById('confirmPassword').addEventListener('click', confirmPassword);
    document.getElementById('cancelPassword').addEventListener('click', hidePasswordModal);
}

// 开始调查
function startInvestigation() {
    showDialogue('你决定深入调查这个神秘的医院。走廊尽头似乎有什么在等着你...', 'investigator');
    
    setTimeout(() => {
        showChoices([
            {
                text: '检查走廊上的可疑物品',
                action: () => createHotspots()
            },
            {
                text: '寻找医院工作人员',
                action: () => meetCharacter('ting_nurse')
            }
        ]);
    }, 2000);
}

// 切换背包面板
function toggleInventory() {
    const panel = document.getElementById('inventoryPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

// 显示地图模态框
function showMapModal() {
    document.getElementById('mapModal').classList.remove('hidden');
}

function closeMapModal() {
    document.getElementById('mapModal').classList.add('hidden');
}

// 保存游戏
function saveGame() {
    const saveData = {
        gameState: gameState,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('hospital_mystery_save', JSON.stringify(saveData));
    
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50';
    notification.textContent = '游戏进度已保存';
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 2000);
}

// 切换场景
function changeScene(sceneId) {
    const scene = gameData.scenes[sceneId];
    if (!scene) return;
    
    // 检查场景是否锁定
    if (scene.locked) {
        if (scene.requiredClue && !gameState.collectedClues.find(c => c.id === scene.requiredClue)) {
            showDialogue(`这个区域目前无法进入，可能需要找到特定的线索。`, 'investigator');
            return;
        }
        if (scene.requiredClues && !scene.requiredClues.every(clueId => 
            gameState.collectedClues.find(c => c.id === clueId))) {
            showDialogue(`需要更多线索才能进入这个区域。`, 'investigator');
            return;
        }
    }
    
    gameState.currentScene = sceneId;
    gameState.visitedScenes.add(sceneId);
    
    // 更新场景背景
    const sceneContainer = document.getElementById('sceneContainer');
    sceneContainer.style.backgroundImage = `url('${scene.background}')`;
    
    // 更新进度
    gameState.gameProgress.scenesExplored = gameState.visitedScenes.size;
    gameState.updateProgress();
    
    // 清除现有热点
    clearHotspots();
    
    // 创建新热点
    setTimeout(() => {
        createHotspots();
    }, 500);
    
    // 显示场景描述
    showDialogue(scene.description, 'investigator');
}

// 创建交互热点
function createHotspots() {
    const scene = gameData.scenes[gameState.currentScene];
    const container = document.getElementById('hotspotsContainer');
    
    scene.hotspots.forEach(hotspot => {
        const element = document.createElement('div');
        element.className = 'absolute cursor-pointer hover:bg-white hover:bg-opacity-20 transition-all duration-300 rounded';
        element.style.left = `${hotspot.x}%`;
        element.style.top = `${hotspot.y}%`;
        element.style.width = `${hotspot.width}%`;
        element.style.height = `${hotspot.height}%`;
        element.style.animation = 'pulse 2s infinite';
        
        element.addEventListener('click', () => {
            if (hotspot.character) {
                meetCharacter(hotspot.character);
            } else {
                hotspot.action();
            }
        });
        
        container.appendChild(element);
    });
}

// 清除热点
function clearHotspots() {
    const container = document.getElementById('hotspotsContainer');
    container.innerHTML = '';
}

// 遇见角色
function meetCharacter(characterId) {
    const character = gameData.characters[characterId];
    if (!character) return;
    
    gameState.currentCharacter = characterId;
    
    // 显示角色立绘
    const characterContainer = document.getElementById('characterContainer');
    const characterPortrait = document.getElementById('characterPortrait');
    
    if (character.portrait) {
        characterPortrait.src = character.portrait;
        characterContainer.classList.remove('opacity-0');
        characterContainer.classList.add('opacity-100');
    }
    
    // 显示对话
    showDialogue(character.dialogue[0], characterId);
    
    // 创建选择
    setTimeout(() => {
        createCharacterChoices(characterId);
    }, 2000);
}

// 创建角色对话选择
function createCharacterChoices(characterId) {
    const character = gameData.characters[characterId];
    const choices = [
        {
            text: `询问${character.name}关于医院的秘密`,
            action: () => {
                showDialogue(character.dialogue[1] || '我不想谈论这个话题。', characterId);
            }
        },
        {
            text: '询问最近发生的异常事件',
            action: () => {
                showDialogue(character.dialogue[2] || '我什么都不知道。', characterId);
            }
        },
        {
            text: '询问婷护士的下落',
            action: () => {
                showDialogue(character.dialogue[3] || '她...她失踪了。', characterId);
            }
        }
    ];
    
    if (characterId === 'chen_juzi' && gameState.collectedClues.length >= 5) {
        choices.push({
            text: '揭露真相',
            action: () => {
                showDialogue(character.dialogue[4] || '你什么都证明不了。', characterId);
                setTimeout(() => checkEnding(), 3000);
            }
        });
    }
    
    choices.push({
        text: '离开',
        action: () => {
            hideCharacter();
            showDialogue('你结束了对话。', 'investigator');
        }
    });
    
    showChoices(choices);
}

// 隐藏角色
function hideCharacter() {
    const characterContainer = document.getElementById('characterContainer');
    characterContainer.classList.add('opacity-0');
    gameState.currentCharacter = null;
}

// 显示对话
function showDialogue(text, characterId = 'investigator') {
    const dialogueText = document.getElementById('dialogueText');
    dialogueText.textContent = text;
    
    // 添加打字机效果
    dialogueText.classList.add('typing-animation');
    setTimeout(() => {
        dialogueText.classList.remove('typing-animation');
    }, 2000);
}

// 显示选择
function showChoices(choices) {
    const container = document.getElementById('choicesContainer');
    container.innerHTML = '';
    
    choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.className = 'choice-button w-full p-3 rounded-lg text-left transition-all duration-300';
        button.textContent = choice.text;
        button.addEventListener('click', choice.action);
        container.appendChild(button);
    });
}

// 更新线索列表
function updateCluesList() {
    const container = document.getElementById('cluesList');
    container.innerHTML = '';
    
    if (gameState.collectedClues.length === 0) {
        container.innerHTML = '<div class="text-gray-400 text-center py-8">暂无收集到的线索</div>';
        return;
    }
    
    gameState.collectedClues.forEach(clue => {
        const clueElement = document.createElement('div');
        clueElement.className = 'clue-item p-3 rounded-lg cursor-pointer';
        clueElement.innerHTML = `
            <div class="flex items-center space-x-3">
                <span class="text-2xl">${clue.icon}</span>
                <div>
                    <div class="font-bold text-sm">${clue.name}</div>
                    <div class="text-xs text-gray-400 mt-1">${clue.description}</div>
                </div>
            </div>
        `;
        container.appendChild(clueElement);
    });
}

// 显示密码模态框
function showPasswordModal(correctPassword, onSuccess) {
    const modal = document.getElementById('passwordModal');
    const input = document.getElementById('passwordInput');
    
    modal.classList.remove('hidden');
    input.value = '';
    input.focus();
    
    window.currentPassword = correctPassword;
    window.passwordCallback = onSuccess;
}

// 隐藏密码模态框
function hidePasswordModal() {
    document.getElementById('passwordModal').classList.add('hidden');
    window.currentPassword = null;
    window.passwordCallback = null;
}

// 确认密码
function confirmPassword() {
    const input = document.getElementById('passwordInput');
    const enteredPassword = input.value;
    
    if (enteredPassword === window.currentPassword) {
        hidePasswordModal();
        if (window.passwordCallback) {
            window.passwordCallback();
        }
    } else {
        input.style.borderColor = '#ef4444';
        setTimeout(() => {
            input.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        }, 1000);
    }
}

// 检查结局
function checkEnding() {
    const evidenceCount = gameState.collectedClues.filter(c => 
        ['human_experiment_evidence', 'missing_patients_evidence', 'experiment_approval'].includes(c.id)
    ).length;
    
    if (evidenceCount >= 3) {
        showEnding('truth', '真相揭露结局', '你成功收集了足够的证据，揭露了医院的非法人体实验。婷护士和其他失踪的患者得救了，陈院长被逮捕。正义最终得到了伸张。');
    } else if (gameState.collectedClues.length >= 8) {
        showEnding('escape', '逃离结局', '你带着部分线索逃离了医院，但证据不足以让警方相信你的说法。医院的秘密实验继续进行，而你只能眼睁睁地看着悲剧继续发生。');
    } else {
        showEnding('missing', '失踪结局', '在调查过程中，你神秘地失踪了。就像婷护士一样，没有人知道你去了哪里。医院继续着它黑暗的实验，而你成为了又一个无声的受害者。');
    }
}

// 显示结局
function showEnding(type, title, description) {
    gameState.endings[type] = true;
    
    document.getElementById('endingTitle').textContent = title;
    document.getElementById('endingDescription').textContent = description;
    document.getElementById('endingScreen').classList.remove('hidden');
}

// 重新开始游戏
function restartGame() {
    gameState = new GameState();
    document.getElementById('endingScreen').classList.add('hidden');
    changeScene('corridor');
    updateCluesList();
}

// 显示制作人员
function showCredits() {
    alert('《城郊医院谜案》\n\n制作：AI助手\n美术：AI图像生成\n程序：HTML5 + JavaScript\n\n感谢游玩！');
}

// 键盘事件监听
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hidePasswordModal();
        closeMapModal();
    }
    
    if (e.key === 'Enter' && !document.getElementById('passwordModal').classList.contains('hidden')) {
        confirmPassword();
    }
});

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', initGame);