const slides = document.querySelectorAll(".hero-slide");

const images = [
  "images_/hero1.png",
  "images_/hero2.png",
  "images_/hero3.png",
  "images_/hero4.png",
  "images_/hero5.png"
];

let current = 0;

// assign images
slides.forEach((slide, i) => {
  slide.style.backgroundImage = `url(${images[i % images.length]})`;
});

// cycle
setInterval(() => {
  slides[current].classList.remove("active");
  current = (current + 1) % slides.length;
  slides[current].classList.add("active");
}, 5000);
