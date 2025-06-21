
exports.clamp = function(value, min, max, round = 0.000001) {
  if (min > max) return Math.round(Math.max(Math.min(min, value), max) / round) * round;
  return Math.round(Math.max(Math.min(max, value), min) / round) * round;
}

exports.dist = function(pointa, pointb) {
  return Math.sqrt((pointa.x - pointb.x) ** 2 + (pointa.y - pointb.y) ** 2);
}

exports.RectangleCircle = function (rect, circle) {
  let testX = circle.x;
  let testY = circle.y;
  if (circle.x < rect.x) testX = rect.x;
  else if (circle.x > rect.x + rect.w) testX = rect.x + rect.w;
  if (circle.y < rect.y) testY = rect.y;
  else if (circle.y > rect.y + rect.h) testY = rect.y + rect.h;

  let distX = circle.x - testX;
  let distY = circle.y - testY;
  let distance = (distX ** 2) + (distY ** 2);

  return distance <= circle.r ** 2;
}

exports.lineIntersect = function(x1, y1, x2, y2, x3, y3, x4, y4) {
  let uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
  let uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
  if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
    intersectionX = x1 + (uA * (x2-x1));
    intersectionY = y1 + (uA * (y2-y1));
    return [intersectionX, intersectionY];
  }
  return null;
}

// treats rectangles as centered about x,y with a total width of w and h (w/2 and h/2 from origin)
exports.rectangleIntersection = function(r1, r2) {
  // r1 top vs r2 bottom
  if (r1.y + r1.h/2 < r2.y - r2.h/2) return false;
  // r1 right vs r2 left
  if (r1.x + r1.w/2 < r2.x - r2.w/2) return false;
  // r1 bottom vs r2 top
  if (r1.y - r1.h/2 > r2.y + r2.h/2) return false;
  // r1 left vs r2 right
  if (r1.x - r1.w/2 > r2.x + r2.w/2) return false;
  // otherwise they must touch
  return true;
}

exports.lerp = function(start, end, transition = 0.5, quadratic = 1) {
  return start + (end - start) * Math.pow(transition, quadratic);
}

exports.getAngle = function(position1, position2) {
  return Math.atan2(position2.y - position1.y, position2.x - position1.x);
}

exports.normalizeAngle = function(angle) {
  return (angle * Math.PI * 500) % (Math.PI * 2);
}