# Near plane clipping mat4

<img width="1470" height="717" alt="Screenshot 2026-05-29 at 20 15 05" src="https://github.com/user-attachments/assets/ac08c5c7-fcef-44c5-ad14-82427f3e7a5d" />

Ok, so this is an iteration on the previous near-plane-clipping-manual repository. I now added Mat4 support so that I could see where in the pipeline it exactly makes sense to apply the clipping. Right between applying the projection matrix and then dividing by w, apparently. Ok, that gives me a better understanding.

I understand the whole idea behind the clipping algorithm better too now I think, so I might as well write it down here when it's still fresh. So, what do we do?

In the `clipAgainstNearPlane` function:

- We go over each polygon and check if there is any clipping. No clipping? No problem, and we keep committing polygons to the output polygons.
- Once we hit a clipper polygon, we take action. We first call the clipPolygon function. But more on that in a second.
- When we get the results back, we check if it is any good. If we only get zero, one or two vertices back, it's not much for us to draw, so we reject this polygon and move on to the next one. When we get results back with three or more vertices, here's what we do: we loop over them starting from 1, but lower than the max. Then we commit new polygons, where we follow the winding from the base, going [base, base + i, base + i + 1]. If you'd have two new polygons, you'd then end up wiring them as [0, 1, 2] and [0, 2, 3] if you iterated. So you end up with the right amount and with the same wiring.

Ok, but how do we actually handle producing the new vertices? Well, you loop over each of them and consider them and their next neighbor (so it'll loop around where vertex 2 will take vertex 0 as the next one). You then check:

In the `clipPolygon` function:

- Is this vertex to the right side of the near plane? Good, push the guy and move on.
- If this vertex is not inside, consider the next vertex. If that guy is also not inside the frustum, then just move on. But if it is, then we draw a parametric line from the first to the second point and solve for 0 where both intersect. Once we know that, we can create a new vertex where that intersection occurs and that will be the one we can use.
- But! If this first one is inside the frustum, we are also interested to see if the next one is. If it is not, then we do the parametric line solving for 0 trick again and obtain the new vertex where this line intersects, and we commit that one to the new vertices.

Ok, then on the parametric line we calculate in the `intersect` function, it's pretty easy. First you find the right parameter `t` by performing `t = a.z / (a.z - b.z)`. Then you take that t and apply it to the x, y and w by performing `a.x + t * (b.x - a.x)`. It is a shorthand since you can use absolute 0, so it's a reworking of `t = (0 - a.z) / (b.z - a.z)`. You keep the new `z` at `0`. The AI correcting me is adding to this: "The reason you interpolate all four components (including w) is worth noting: w changes continuously along the edge too, and the perspective divide downstream needs the correct w at the boundary point. That's the key difference from the old world-space version, which only had three components."
