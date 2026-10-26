"""Render a genuinely milled silver assistant key with Blender / Cycles.

Usage:
  blender --background --python scripts/render-assistant-plate.py

The rounded metal body and recessed chat / sparkle mark are geometry, not a
texture decal. The two transparent renders share camera, object and framing;
only a studio strip light moves for the restrained hover reflection.
Editable scene and uncompressed masters stay in outputs/assistant-plate.
No external models or image textures are required.
"""

from pathlib import Path
import math
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "outputs" / "assistant-plate"
PUBLIC = ROOT / "public" / "showcase" / "case"
OUT.mkdir(parents=True, exist_ok=True)
PUBLIC.mkdir(parents=True, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)


def material(name, color, roughness, metallic=1):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    return mat, shader


silver, shader = material("Bead-blasted aluminium — soft brushed face", (.62, .62, .62), .24)
shader.inputs["Anisotropic"].default_value = .32
shader.inputs["Coat Weight"].default_value = .12
shader.inputs["Coat Roughness"].default_value = .2
nodes, links = silver.node_tree.nodes, silver.node_tree.links
# Explicit constant tangent avoids the radial UV tangent of an extruded curve.
tangent = nodes.new("ShaderNodeCombineXYZ")
tangent.inputs["X"].default_value = 1
links.new(tangent.outputs["Vector"], shader.inputs["Tangent"])
coord = nodes.new("ShaderNodeTexCoord")
stretch = nodes.new("ShaderNodeVectorMath")
stretch.operation = "MULTIPLY"
stretch.inputs[1].default_value = (1, 36, 4)
noise = nodes.new("ShaderNodeTexNoise")
noise.inputs["Scale"].default_value = 65
noise.inputs["Detail"].default_value = 2
noise.inputs["Roughness"].default_value = .55
bump = nodes.new("ShaderNodeBump")
bump.inputs["Strength"].default_value = .032
bump.inputs["Distance"].default_value = .0015
links.new(coord.outputs["Generated"], stretch.inputs[0])
links.new(stretch.outputs["Vector"], noise.inputs["Vector"])
links.new(noise.outputs["Fac"], bump.inputs["Height"])
links.new(bump.outputs["Normal"], shader.inputs["Normal"])
engraving, _ = material("Laser-darkened silver inside recessed engraving", (.072, .072, .072), .32)


def rounded_rectangle(width, height, radius, segments=32):
    result = []
    for cx, cy, start in (
        (width / 2 - radius, height / 2 - radius, 0),
        (-width / 2 + radius, height / 2 - radius, 90),
        (-width / 2 + radius, -height / 2 + radius, 180),
        (width / 2 - radius, -height / 2 + radius, 270),
    ):
        for step in range(segments + 1):
            angle = math.radians(start + step / segments * 90)
            result.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))
    return result


profile = bpy.data.curves.new("CNC rounded square profile", "CURVE")
profile.dimensions = "2D"
profile.resolution_u = 32
profile.fill_mode = "BOTH"
profile.extrude = .14
profile.bevel_depth = .085
profile.bevel_resolution = 12
spline = profile.splines.new("POLY")
outline = rounded_rectangle(3.0, 3.0, .43)
spline.points.add(len(outline) - 1)
for point, (x, y) in zip(spline.points, outline):
    point.co = (x, y, 0, 1)
spline.use_cyclic_u = True
plate = bpy.data.objects.new("Assistant key — solid aluminium billet", profile)
bpy.context.collection.objects.link(plate)
bpy.context.view_layer.objects.active = plate
plate.select_set(True)
bpy.ops.object.convert(target="MESH")
plate = bpy.context.object
plate.data.materials.append(silver)
plate.data.materials.append(engraving)


def icon_point(x, y):
    # The existing 24 px assistant icon, centred as a single engraved symbol.
    return ((x - 13) * .105, (11.5 - y) * .105)


def arc(cx, cy, radius, start, end, steps=14):
    return [(cx + radius * math.cos(math.radians(start + (end - start) * i / steps)),
             cy + radius * math.sin(math.radians(start + (end - start) * i / steps)))
            for i in range(1, steps + 1)]


chat = [(18, 12), (18, 15)]
chat += arc(15, 15, 3, 0, 90)
chat += [(9, 18), (4, 21), (4, 7)]
chat += arc(7, 7, 3, 180, 270)
chat += [(12, 4)]
sparkle = [(18, 2), (19.1, 4.9), (22, 6), (19.1, 7.1),
           (18, 10), (16.9, 7.1), (14, 6), (16.9, 4.9)]


def groove(name, points, cyclic=False):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 24
    curve.bevel_depth = .074
    curve.bevel_resolution = 10
    curve.use_fill_caps = True
    path = curve.splines.new("POLY")
    path.points.add(len(points) - 1)
    for p, (x, y) in zip(path.points, points):
        u, v = icon_point(x, y)
        p.co = (u, v, .244, 1)
    path.use_cyclic_u = cyclic
    cutter = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(cutter)
    bpy.ops.object.select_all(action="DESELECT")
    cutter.select_set(True)
    bpy.context.view_layer.objects.active = cutter
    bpy.ops.object.convert(target="MESH")
    cutter = bpy.context.object
    cutter.data.materials.append(silver)
    cutter.data.materials.append(engraving)
    for polygon in cutter.data.polygons:
        polygon.material_index = 1
    bpy.context.view_layer.objects.active = plate
    boolean = plate.modifiers.new(name, "BOOLEAN")
    boolean.operation = "DIFFERENCE"
    boolean.solver = "EXACT"
    boolean.object = cutter
    bpy.ops.object.modifier_apply(modifier=boolean.name)
    bpy.data.objects.remove(cutter, do_unlink=True)


groove("Recessed chat bubble — CNC ball-nose groove", chat)
groove("Recessed four-point assistant sparkle", sparkle, True)
# A very small chamfer catches studio reflections along the milled mark.
bevel = plate.modifiers.new("Fine tool-edge chamfer", "BEVEL")
bevel.width = .008
bevel.segments = 3
bevel.limit_method = "ANGLE"
bevel.angle_limit = math.radians(29)
bevel.affect = "EDGES"
for polygon in plate.data.polygons:
    polygon.use_smooth = abs(polygon.normal.z) < .999
normal = plate.modifiers.new("Weighted milled face normals", "WEIGHTED_NORMAL")
normal.keep_sharp = True
normal.weight = 60


def aim(obj, target=(0, 0, 0)):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def area(name, location, energy, width, height, target=(0, 0, 0)):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.color = (1, 1, 1)
    data.shape = "RECTANGLE"
    data.size = width
    data.size_y = height
    light = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(light)
    light.location = location
    aim(light, target)
    return light


area("Large overhead silk", (-2.4, 3.8, 5.0), 420, 5.0, 3.0)
area("Left vertical strip — polished bevel", (-3.8, .2, 3.0), 300, 1.1, 5.5)
strip = area("Moving studio strip — hover reflection", (2.8, 2.0, 5.3), 250, 1.2, 4.8)
area("Lower soft reflection", (.5, -4.5, 2.4), 120, 4.5, 1.2)
world = bpy.data.worlds.new("Neutral photographic studio")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (.11, .11, .11, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = .5
bpy.context.scene.world = world

camera_data = bpy.data.cameras.new("Assistant plate — orthographic product camera")
camera = bpy.data.objects.new(camera_data.name, camera_data)
bpy.context.collection.objects.link(camera)
camera.location = (0, -1.12, 8)
aim(camera)
camera_data.type = "ORTHO"
camera_data.ortho_scale = 3.34
bpy.context.scene.camera = camera

scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 96
scene.cycles.use_denoising = True
scene.render.resolution_x = 1024
scene.render.resolution_y = 1024
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.color_depth = "8"
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.render.filepath = str(OUT / "assistant-plate.png")
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "assistant-plate.blend"))
bpy.ops.render.render(write_still=True)

# Shift only the white softbox: no blue light, aura, geometry or camera change.
strip.location = (1.25, .4, 5.3)
strip.data.energy = 295
aim(strip)
scene.render.filepath = str(OUT / "assistant-plate-hover.png")
bpy.ops.render.render(write_still=True)
print(f"Rendered neutral transparent assistant plate masters to {OUT}")

# Encode the Blender pixels to lossless WebP; no paint-over or generated texture.
import shutil
import subprocess
encoder = """from pathlib import Path
from PIL import Image
import sys
source, target = map(Path, sys.argv[1:])
for name in ('assistant-plate', 'assistant-plate-hover'):
    image = Image.open(source / (name + '.png')).convert('RGBA')
    image = image.resize((512, 512), Image.Resampling.LANCZOS)
    image.save(target / (name + '.webp'), lossless=True, method=6, exact=True)
"""
subprocess.run([shutil.which('python3'), '-c', encoder, str(OUT), str(PUBLIC)], check=True)
print(f"Encoded lossless transparent renders in {PUBLIC}")
