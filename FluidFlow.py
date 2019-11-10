"""
Fluid particles travelling through a vector field
By Sam Brunacini
"""

import pygame;
import math;
from math import hypot, atan2, sin, cos, pi;

pygame.init();
WIDTH, HEIGHT = 600, 600;
TITLE = "Fluid simulation";
MAX_FPS = 30;

TWO_PI = 2 * pi;
QUARTER_PI = pi / 4;
WHITE = (255, 255, 255);
RED = (255, 0, 0);
BLACK = (0, 0, 0);

screen = pygame.display.set_mode((WIDTH, HEIGHT));
pygame.display.set_caption(TITLE);
pygame.key.set_repeat(100, 50);
clock = pygame.time.Clock();

x_units, y_units = 8, 8;
hwidth, hheight = WIDTH / 2, HEIGHT / 2;
x_scale, y_scale = WIDTH / x_units, HEIGHT / y_units;
x_stop = x_units / 2; x_start = -x_stop;
y_stop = y_units / 2; y_start = -y_stop;


def from_polar(r, theta):
    """ convert a vector from polar form to rectangular form """
    return r * cos(theta), r * sin(theta);

def create_text_surface(text, size, color):
    """ creates a surface with text on it """
    return pygame.font.SysFont("arial", size).render(text, 1, color);

def text(surface, position, text, size, color):
    """ draw text to a surface """
    text = create_text_surface(text, size, color);
    surface.blit(text, position);

def safe_drange(start, stop, step=1, precision=2):
    scaler = 10 ** precision;
    start, stop = start * scaler, stop * scaler;
    step = step * scaler;
    
    for i in range(int(start), int(stop), int(step)):
        yield i / scaler;

def translate_and_scale(x, y):
    """ scale the coordinates and put the origin in the center of the screen """
    return (x * x_scale) + hwidth, hheight - (y * y_scale)

def draw_arrow(A, B, color, surf, width=2):
    """ draw an arrow """
    # efficiency does not matter in these calculations because they are only done once at the beginning.
    dy, dx = A[1] - B[1], A[0] - B[0];
    angle = atan2(dy, dx);
    if angle < 0:
        mang = (angle + TWO_PI) / TWO_PI;
    else:
        mang = angle / TWO_PI;
    value = 255 * mang;
    color = (0, value, value);
    
    dist = hypot(dx, dy) / 5; # divide by five so the arrow's prongs aren't as long as the tail
    x1, y1 = from_polar(dist, angle + QUARTER_PI);
    x2, y2 = from_polar(dist, angle - QUARTER_PI);
    pygame.draw.line(surf, color, A, B, width);
    pygame.draw.line(surf, color, B, (B[0] + x1, B[1] + y1), width);
    pygame.draw.line(surf, color, B, (B[0] + x2, B[1] + y2), width);


class VectorField():

    def __init__(self, function, vecs_per_unit=2, color=RED):
        self.function = function;
        self.vecs_per_unit = vecs_per_unit;
        self.step = 1 / self.vecs_per_unit;
        self.color = color;
        self._generate_vectors();

    def _generate_vectors(self):
        self.vectors = [];
        for x in safe_drange(x_start, x_stop, self.step):
            for y in safe_drange(y_start, y_stop, self.step):
                try:
                    dx, dy = self.function(x, y);
                    self.vectors.append((x, y, x + dx / 8, y + dy / 8));
                except ZeroDivisionError:
                    continue;

    def draw(self, surf):
        for vector in self.vectors:
            draw_arrow(translate_and_scale(vector[0], vector[1]), translate_and_scale(vector[2], vector[3]), self.color, surf);


class Particle():

    def __init__(self, function, x, y, color=(255, 0, 0), speed_scale=35):
        self.function = function;
        self.color = color;
        self.speed_scale = speed_scale;
        self.initial_speed = 1 / self.speed_scale;
        self.x, self.y = x, y;

    def move(self):
        try:
            dx, dy = self.function(self.x, self.y);
        except ZeroDivisionError:
            dx, dy = 0, 0;
        self.x += dx / self.speed_scale;
        self.y += dy / self.speed_scale;

    def draw(self):
        center = translate_and_scale(self.x, self.y);
        pygame.draw.circle(screen, self.color, (int(center[0]), int(center[1])), 2);

    def update(self):
        self.move();
        self.draw();

    
#function = lambda x, y: (cos(x*x + y*y), sin(x*x + y*y)); # Attraction curve
#function = lambda x, y: (sin(x + cos(y)), sin(y)); # Attraction points
#function = lambda x, y: (cos(y)/2, x/2); # Swirl point (off center in y direction)
#function = lambda x, y: (sin(y), -x); # Swirl point (center)
function = lambda x, y: (sin(2*y), -x/2); # Multiple swirl points along the y axis
#function = lambda x, y: (math.atan(y - x), x*cos(x)); # Attraction points
#function = lambda x, y: (x-y, x+y); # Repelling point
#function = lambda x, y: (sin(x-y), sin(y+x)); # Repelling points and attraction points
#function = lambda x, y: (0, y + sin(x)); # Repelling curve sin(x)



def generate_particles(function):
    v = VectorField(function, vecs_per_unit=4);
    particles = [];
    step = 0.1 * (((x_units + y_units) // 2) / 8);
    for x in safe_drange(x_start, x_stop, step):
        for y in safe_drange(y_start, y_stop, step):            
            particles.append(Particle(function, x, y));
    return v, particles;

v, particles = generate_particles(function);
inter = pygame.Surface((WIDTH, HEIGHT));
inter.fill(WHITE);
v.draw(inter);

running = True;
while running:
    screen.blit(inter, (0, 0));
    for p in particles:
        p.update();
    pygame.draw.rect(screen, WHITE, (10, 10, 200, 28));
    text(screen, (10, 10), "Swirl points", 25, BLACK);
    pygame.display.flip();
    clock.tick(MAX_FPS);
    
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False;
            break;
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                running = False;
                break;
pygame.quit();
