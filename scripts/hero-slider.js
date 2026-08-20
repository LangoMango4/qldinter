const slides = document.querySelectorAll(".hero-slide");

const images = [
  "assets/images/hero1.png",
  "assets/images/hero2.png",
  "assets/images/hero3.png",
  "assets/images/hero4.png",
  "assets/images/hero5.png",
  "assets/images/hero6.png",
  "assets/images/hero7.png",
  "assets/images/hero8.png"
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

