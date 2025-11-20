(() => {
    const canvas = document.getElementById("bg");
    if (!canvas) { console.warn("[intro.js] #bg canvas not found"); return; }
    const ctx = canvas.getContext("2d");

    function resizeCanvas() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth, h = window.innerHeight;
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const gridImg = new Image();
    gridImg.src = "assets/grid.png";

    function drawBackground() {
        const vw = window.innerWidth, vh = window.innerHeight;
        ctx.clearRect(0, 0, vw, vh);

        if (gridImg.complete && gridImg.naturalWidth > 0) {
            const iw = gridImg.naturalWidth, ih = gridImg.naturalHeight;
            const scale = Math.max(vw / iw, vh / ih);   // cover
            const w = iw * scale, h = ih * scale;
            const x = (vw - w) / 2, y = (vh - h) / 2;
            ctx.drawImage(gridImg, x, y, w, h);
        } else {
            ctx.fillStyle = "darkslateblue";
            ctx.fillRect(0, 0, vw, vh);
        }
    }

    function render() { resizeCanvas(); drawBackground(); }


    let scheduled = false;
    function onResize() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => { scheduled = false; render(); });
    }

    window.addEventListener("resize", onResize);
    gridImg.addEventListener("load", render);


    window.BG = { canvas, ctx, drawBackground, render };

    render();
})();