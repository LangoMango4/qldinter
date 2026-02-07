const images = [
  "images_/hero1.png",
  "images_/hero2.png",
  "images_/hero3.png",
  "images_/hero4.png",
  "images_/hero5.png"
];

const slides = document.querySelectorAll(".hero-slide");
let current = 0;
let next = 1;

slides[0].style.backgroundImage = `url(${images[0]})`;
slides[1].style.backgroundImage = `url(${images[1]})`;

setInterval(() => {
  slides[next].style.backgroundImage = `url(${images[(current + 1) % images.length]})`;

  slides[current].classList.remove("active");
  slides[next].classList.add("active");

  current = (current + 1) % slides.length;
  next = (next + 1) % slides.length;
}, 6000);
