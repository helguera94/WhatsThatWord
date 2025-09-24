const canvas = document.querySelector('#bg')
const c = canvas.getContext('2d');


function resizeCanvas(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', () => {
    resizeCanvas();
    drawImageFullScreen();
});

const image = new Image();
const textBox = new Image();
image.src = './assets/grid.png';
textBox.src = './assets/textBox.png';
console.log(image);

function drawImageFullScreen(){

    c.drawImage(image, 0, 0, canvas.width, canvas.height);

    c.drawImage(textBox, 0, 0, canvas.width, canvas.height);

}
image.onload = drawImageFullScreen;
textBox.onload = drawImageFullScreen;
let introText = "Welcome to the game! WHAT'S THAT WORD";
document.querySelector('#intro-text').innerHTML = introText;