/*
Each of our html pages has a custom animation, that controls how 
it and its children move on and off screen during page toggles

To stay organized, we define the functions in this file
*//*
const compStyle = getComputedStyle(document.documentElement);

function closeAfter(element) {
  element.style.opacity = "0";
}

function openBefore(element) {
  element.style.opacity = "1";
}

// front page
document.getElementById("frontpage").opened = function(closed) {
  openBefore(this);
  this.style.top = "0";
}
document.getElementById("frontpage").closed = function(opened) {
  this.style.top = "110%";
  closeAfter(this);
}

// settings page
document.getElementById("settingspage").opened = function(closed) {
  openBefore(this);
  this.style.left = "0";
}
document.getElementById("settingspage").closed = function(opened) {
  this.style.left = "-110%";
  closeAfter(this);
}*/