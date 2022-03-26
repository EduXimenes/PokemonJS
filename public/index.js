const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

//Definindo a largura e altura do canvas renderizado
canvas.width = 1024;
canvas.height = 576;

//criando um array com os valores dos 70tiles (eixo X, dimensões do mapa criado) para identificar as colisões
const collisionsMap = []
for (let i = 0; i < collisions.length; i += 70) {
    collisionsMap.push(collisions.slice(i, 70 + i))
}

const battleZonesMap = []
for (let i = 0; i < battleZonesData.length; i += 70) {
    battleZonesMap.push(battleZonesData.slice(i, 70 + i))
}


//Classe responsável por criar o modelo de colisões, onde cada bloco possui 48tiles por 48tiles, por conta do zoom de 400% do mapa
//Inicialmente esse projeto foi projetado com 12tiles, mas para gameplay foi setado o zoom de 400%

//bondaries é a variável responsável por dimensionar os blocos de colisões
const boundaries = []

// offset é o valor padrão inicial de posicionamento do background
const offset = {
    x: -350,
    y: -660
}
//o mapeamento das colisões considera cada "coluna(symbol)" dentro de cada "linha(row)" e insere esses valores no array bondaries
//considerando apenas os valores (symbol) que forem exatamente 1025, identificando onde há blocos de colisões no array de colisões
collisionsMap.forEach((row, i) => {
    row.forEach((symbol, j) => {
        if (symbol === 1025) {
            boundaries.push(
                new Boundary({
                    position: {
                        x: j * Boundary.width + offset.x,
                        y: i * Boundary.height + offset.y
                    }
                })
            )
        }
    })
})

const battleZones = []

battleZonesMap.forEach((row, i) => {
    row.forEach((symbol, j) => {
        if (symbol === 1025) {
            battleZones.push(
                new Boundary({
                    position: {
                        x: j * Boundary.width + offset.x,
                        y: i * Boundary.height + offset.y
                    }
                })
            )
        }
    })
})

//importando o Mapa
const map = new Image()
map.src = './Assets/Map/Pallet Town2.png';

//importando o foreground
const foregroundImage = new Image()
foregroundImage.src = './Assets/Map/foregroundObj.png';

//importando os sprites do player
const playerUpImage = new Image()
playerUpImage.src = './Assets/Player/playerUp.png';
//importando os sprites do player
const playerDownImage = new Image()
playerDownImage.src = './Assets/Player/playerDown.png';
//importando os sprites do player
const playerLeftImage = new Image()
playerLeftImage.src = './Assets/Player/playerLeft.png';
//importando os sprites do player
const playerRightImage = new Image()
playerRightImage.src = './Assets/Player/playerRight.png';

//criando uma classe Sprite para permitir a movimentação do mapa/personagem

//criando um player do tipo Sprite
const player = new Sprite({
    position: {
        x: canvas.width / 2 - 192 / 4 / 2,
        y: canvas.height / 2 - 68 / 2
    },
    image: playerDownImage,
    frames: {
        max: 4
    },
    sprites: {
        up: playerUpImage,
        down: playerDownImage,
        left: playerLeftImage,
        right: playerRightImage
    },
})

//criando uma constante background que é do tipo Sprite, onde pega seu valor de x e y do offset(valor padrão) e sua imagem de map
const background = new Sprite({
    position: {
        x: offset.x,
        y: offset.y
    },
    image: map
})
const foreground = new Sprite({
    position: {
        x: offset.x,
        y: offset.y
    },
    image: foregroundImage
})

//A constante keys determina que as teclas de movimentação não estão pressionadas inicialmente 
const keys = {
    w: {
        pressed: false
    },
    a: {
        pressed: false
    },
    s: {
        pressed: false
    },
    d: {
        pressed: false
    }
}

//movables é um array responsável pela movimentação, tanto do mapa quanto dos blocos de colisões para "não ficarem soltos"
const movables = [background, ...boundaries, foreground, ...battleZones]
//Como não podemos inserir um array dentro de outro, ... pega os valores deste array
function rectangularColission({ rectangle1, rectangle2 }) {
    return (rectangle1.position.x + rectangle1.width >= rectangle2.position.x &&
        rectangle1.position.x <= rectangle2.position.x + rectangle2.width &&
        rectangle1.position.y <= rectangle2.position.y + rectangle2.height &&
        rectangle1.position.y + rectangle1.height >= rectangle2.position.y)
}

const battle = {
    initiated: false
}
// criando um loop infinito chamando a função animate com requestAnimationFrame
function animate() {
    const animationId = window.requestAnimationFrame(animate)
    background.draw()
    boundaries.forEach(boundary => {
        boundary.draw()

    })
    battleZones.forEach(battleZones => {
        battleZones.draw()
    })
    player.draw()
    foreground.draw()

    let moving = true
    player.moving = false

    if (battle.initiated) return

    //ativa uma batalha 
    if (keys.w.pressed || keys.a.pressed || keys.s.pressed || keys.d.pressed) {
        for (let i = 0; i < battleZones.length; i++) {
            const battleZone = battleZones[i]
            const overlappinArea =
                (Math.min(player.position.x + player.width, battleZone.position.x + battleZone.width) -
                    Math.max(player.position.x, battleZone.position.x)) *
                (Math.min(player.position.y + player.height, battleZone.position.y + battleZone.height) -
                    Math.max(player.position.y, battleZone.position.y))
            if (
                rectangularColission({
                    rectangle1: player,
                    rectangle2: battleZone
                }) &&
                overlappinArea > (player.width * player.height / 2) &&
                Math.random() < 0.01
            ) {
                battle.initiated = true
                window.cancelAnimationFrame(animationId)
                //GSAP é uma biblioteca js para animações, responsavel pela mudança de tela na battle
                gsap.to('.battleContainer', {
                    opacity: 1,
                    repeat: 3,
                    yoyo: true,
                    duration: 0.5,
                    onComplete() {
                        gsap.to('.battleContainer', {
                            opacity: 1,
                            duration: 0.5,
                            onComplete() {
                                animateBattle()
                                gsap.to('.battleContainer', {
                                    opacity: 0,
                                    duration: 0.5,
                                })
                            }
                        })
                    }
                })

                break
            }
        }
    }


    //os ifs estão identificando qual tecla está sendo pressionada e soma/subtrai 3 das posições dos movables(objetos moveis, mapas)
    if (keys.w.pressed && lastKey === 'w') {
        player.moving = true
        player.image = player.sprites.up
        for (let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i]
            if (
                rectangularColission({
                    rectangle1: player,
                    rectangle2: {
                        ...boundary, position: {
                            x: boundary.position.x,
                            y: boundary.position.y + 3
                        }
                    }
                })
            ) {
                moving = false
                break
            }
        }

        if (moving)
            movables.forEach((movables) => {
                movables.position.y += 3
            })
    }
    else if (keys.s.pressed && lastKey === 's') {
        player.moving = true
        player.image = player.sprites.down
        for (let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i]
            if (
                rectangularColission({
                    rectangle1: player,
                    rectangle2: {
                        ...boundary, position: {
                            x: boundary.position.x,
                            y: boundary.position.y - 3
                        }
                    }
                })
            ) {
                moving = false
                break
            }
        }
        if (moving)
            movables.forEach((movables) => {
                movables.position.y -= 3
            })
    }
    else if (keys.a.pressed && lastKey === 'a') {
        player.moving = true
        player.image = player.sprites.left
        for (let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i]
            if (
                rectangularColission({
                    rectangle1: player,
                    rectangle2: {
                        ...boundary, position: {
                            x: boundary.position.x + 3,
                            y: boundary.position.y
                        }
                    }
                })
            ) {
                moving = false
                break
            }
        }
        if (moving)
            movables.forEach((movables) => {
                movables.position.x += 3
            })
    }
    else if (keys.d.pressed && lastKey === 'd') {
        player.moving = true
        player.image = player.sprites.right
        for (let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i]
            if (
                rectangularColission({
                    rectangle1: player,
                    rectangle2: {
                        ...boundary, position: {
                            x: boundary.position.x - 3,
                            y: boundary.position.y
                        }
                    }
                })
            ) {
                moving = false
                break
            }
        }
        if (moving)
            movables.forEach((movables) => {
                movables.position.x -= 3
            })
    }

}
//animate()

const battleBrackgroundImage = new Image()
battleBrackgroundImage.src = './Assets/Map/battleBackground2.png'
const battleBackground = new Sprite({
    position: {
        x: 0,
        y: 0
    },
    image: battleBrackgroundImage
})

const draggleImage = new Image()
draggleImage.src = './Assets/Monsters/draggleSprite'
const draggle = new Sprite({
    position: {
        x: 300,
        y: 300
    },
    image: draggleImage
})
function animateBattle() {
    window.requestAnimationFrame(animateBattle)
    battleBackground.draw()
    draggle.draw()
}

animateBattle()

let lastKey = ''

//Evento que observa qual tecla está sendo pressionada e armazena na variável "e", onde possui uma propriedade "key" que pode ser lida
//Eessa propriedade mostra a tecla que foi pressionada, com isso é possível identificar as teclas e movimentar o mapa
window.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'w':
            keys.w.pressed = true
            lastKey = 'w'
            break;
        case 'a':
            keys.a.pressed = true
            lastKey = 'a'
            break;
        case 's':
            keys.s.pressed = true
            lastKey = 's'
            break;
        case 'd':
            keys.d.pressed = true
            lastKey = 'd'
            break;
    }
})
//de forma similar, keyup identifica se a tecla em questão não está pressionada e seta seu estado como false.
window.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'w':
            keys.w.pressed = false
            break;
        case 'a':
            keys.a.pressed = false
            break;
        case 's':
            keys.s.pressed = false
            break;
        case 'd':
            keys.d.pressed = false
            break;
    }
})

