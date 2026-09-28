const slides = document.querySelectorAll(".hero-slide");

const slideSources = [
  "assets/images/hero2.mp4",
  "assets/images/hero1.png",
  "assets/images/hero3.png",
  "assets/images/hero4.png",
  "assets/images/hero5.png",
  "assets/images/hero6.png",
  "assets/images/hero7.png",
  "assets/images/hero8.png"
];

let current = 0;
const videos = new Map();

slides.forEach((slide, i) => {
  const source = slideSources[i % slideSources.length];

  if (/\.mp4(?:$|\?)/i.test(source)) {
    const video = document.createElement("video");
    video.className = "hero-slide-video";
    video.src = source;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.setAttribute("aria-hidden", "true");
    slide.append(video);
    videos.set(slide, video);
  } else {
    slide.style.backgroundImage = `url(${source})`;
  }
});

videos.get(slides[current])?.play().catch(() => {});

// cycle
setInterval(() => {
  const previousSlide = slides[current];
  previousSlide.classList.remove("active");
  videos.get(previousSlide)?.pause();
  current = (current + 1) % slides.length;
  const activeSlide = slides[current];
  activeSlide.classList.add("active");
  videos.get(activeSlide)?.play().catch(() => {});
}, 5000);

