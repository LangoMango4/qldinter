const images = [
  "images_/hero1.png",
  "images_/hero2.png",
  "images_/hero3.png",
  "images_/hero4.png",
  "images_/hero5.png",
  "images_/hero6.png",
  "images_/hero7.png",
  "images_/hero8.png"
];

const slides = document.querySelectorAll(".hero-slide");
let currentImage = 0;

// Initialize slides
slides[0].style.backgroundImage = `url(${images[0]})`;
slides[1].style.backgroundImage = `url(${images[1]})`;
slides[0].classList.add("active");

setInterval(() => {
  // Determine which slide is visible
  const visible = slides[0].classList.contains("active") ? slides[0] : slides[1];
  const hidden = slides[0].classList.contains("active") ? slides[1] : slides[0];

  // Load next image on hidden slide first
  currentImage = (currentImage + 1) % images.length;
  hidden.style.backgroundImage = `url(${images[currentImage]})`;

  // Fade in hidden slide
  visible.classList.remove("active");
  hidden.classList.add("active");
}, 6000);
