"""Render the portfolio's machined four-point assistant object with Blender.

Usage: blender --background --python scripts/render-assistant-star.py -- --motion
The scene, transparent PNG and an inspection render are saved relative to this repo.
No downloaded models, textures, fonts, or external scene dependencies are needed.
"""

import bpy
import math
import shutil
import subprocess
import sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "outputs" / "assistant-star"
ASSET = ROOT / "public" / "showcase" / "case" / "assistant-star.png"
OUT.mkdir(parents=True, exist_ok=True)
ASSET.parent.mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

# A rounded outline rather than a sharp/cusped mathematical star: each vertex
# receives its own quadratic fillet before the profile is extruded and milled.
vertices = [
    (0, 1.55), (0.40, 0.40), (1.55, 0), (0.40, -0.40),
    (0, -1.55), (-0.40, -0.40), (-1.55, 0), (-0.40, 0.40),
]
outline = []
for i, vertex in enumerate(vertices):
    p = Vector(vertex)
    before = Vector(vertices[(i - 1) % len(vertices)])
    after = Vector(vertices[(i + 1) % len(vertices)])
    trim = 0.22 if i % 2 == 0 else 0.24
    a = p + (before - p).normalized() * trim
    b = p + (after - p).normalized() * trim
    for j in range(13):
        t = j / 12
        q = (1 - t) ** 2 * a + 2 * (1 - t) * t * p + t ** 2 * b
        outline.append((q.x, q.y))

profile = bpy.data.curves.new("Rounded four-point machined outline", "CURVE")
profile.dimensions = "2D"
profile.resolution_u = 24
profile.fill_mode = "BOTH"
profile.extrude = 0.165
profile.bevel_depth = 0.105
profile.bevel_resolution = 8
spline = profile.splines.new("POLY")
spline.points.add(len(outline) - 1)
for point, (x, y) in zip(spline.points, outline):
    point.co = (x, y, 0, 1)
spline.use_cyclic_u = True
star = bpy.data.objects.new("Assistant — rounded machined silver", profile)
bpy.context.collection.objects.link(star)
star.rotation_euler[2] = math.radians(-12)
bpy.context.view_layer.objects.active = star
star.select_set(True)
bpy.ops.object.convert(target="MESH")
star = bpy.context.object
for poly in star.data.polygons:
    poly.use_smooth = True
normal = star.modifiers.new("Weighted normals — flat milled face", "WEIGHTED_NORMAL")
normal.keep_sharp = True
normal.weight = 50

silver = bpy.data.materials.new("Satin machined silver · fine surface finish")
silver.use_nodes = True
nodes = silver.node_tree.nodes
links = silver.node_tree.links
metal = nodes.get("Principled BSDF")
metal.inputs["Base Color"].default_value = (0.71, 0.75, 0.81, 1)
metal.inputs["Metallic"].default_value = 1
metal.inputs["Roughness"].default_value = 0.22
metal.inputs["Anisotropic"].default_value = 0.28
metal.inputs["Coat Weight"].default_value = 0.2
metal.inputs["Coat Roughness"].default_value = 0.18
noise = nodes.new("ShaderNodeTexNoise")
noise.inputs["Scale"].default_value = 310
noise.inputs["Detail"].default_value = 2
bump = nodes.new("ShaderNodeBump")
bump.inputs["Strength"].default_value = 0.012
bump.inputs["Distance"].default_value = 0.002
links.new(noise.outputs["Fac"], bump.inputs["Height"])
links.new(bump.outputs["Normal"], metal.inputs["Normal"])
star.data.materials.append(silver)

def aim(obj, target=(0, 0, 0)):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()

def area(name, location, energy, color, size, size_y=None):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.color = color
    data.shape = "RECTANGLE"
    data.size = size
    data.size_y = size_y if size_y else size
    light = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(light)
    light.location = location
    aim(light)
    return light

area("Softbox — broad pearl key", (-3.8, 2.8, 5.8), 700, (1, 0.97, 0.92), 4, 5)
area("Softbox — cool vertical edge", (3.7, 1.0, 3), 1000, (0.80, 0.88, 1), 1.2, 5)
area("Softbox — white lower ribbon", (-0.8, -4, 3), 550, (1, 1, 1), 4.5, 0.65)
area("Softbox — silver rim", (1.5, 3.5, -0.5), 800, (0.9, 0.94, 1), 3, 1)

world = bpy.data.worlds.new("Neutral charcoal studio")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.19, 0.20, 0.23, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.38
bpy.context.scene.world = world

camera_data = bpy.data.cameras.new("Orthographic product portrait")
camera = bpy.data.objects.new("Orthographic product portrait", camera_data)
bpy.context.collection.objects.link(camera)
camera.location = (0, -1.6, 8)
aim(camera)
camera_data.type = "ORTHO"
camera_data.ortho_scale = 3.75
bpy.context.scene.camera = camera

scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 96
scene.cycles.use_denoising = True
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.color_depth = "8"
scene.view_settings.view_transform = "AgX"
scene.render.filepath = str(ASSET)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "assistant-star.blend"))
bpy.ops.render.render(write_still=True)
bpy.data.images["Render Result"].save_render(str(OUT / "assistant-star.png"), scene=scene)
print(f"Rendered transparent assistant object: {ASSET}")

if "--motion" in sys.argv:
    frames = OUT / "frames"
    frames.mkdir(exist_ok=True)
    scene.render.resolution_x = 256
    scene.render.resolution_y = 256
    scene.cycles.samples = 48
    scene.render.fps = 12
    scene.frame_start = 1
    scene.frame_end = 32
    for index in range(32):
        phase = index / 32 * math.tau
        star.rotation_euler = (
            math.radians(8) * math.sin(phase),
            math.radians(13) * math.sin(phase + math.pi / 2),
            math.radians(-12) + math.radians(5) * math.sin(phase),
        )
        star.keyframe_insert(data_path="rotation_euler", frame=index + 1)
        scene.frame_set(index + 1)
        scene.render.filepath = str(frames / f"{index:03d}.png")
        bpy.ops.render.render(write_still=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "assistant-star.blend"))
    # Encoding is separate from modelling/rendering and uses system Pillow.
    encoder = """from PIL import Image
from pathlib import Path
import sys
frames = [Image.open(p).convert('RGBA') for p in sorted(Path(sys.argv[1]).glob('*.png'))]
frames[0].save(sys.argv[2], save_all=True, append_images=frames[1:],
               duration=80, loop=0, quality=93, method=6, minimize_size=True)
print('Encoded 32-frame transparent WebP:', sys.argv[2])
"""
    subprocess.run([
        shutil.which("python3"), "-c", encoder, str(frames),
        str(ASSET.with_name("assistant-star-motion.webp")),
    ], check=True)
