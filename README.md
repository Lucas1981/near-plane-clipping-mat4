# Near plane clipping manual

So in other projects, I ran into trouble when I tried to apply clipping. So I figured I'd take a step back and focus on that part specifically. This is a very simple 3D rendering engine then, with pretty much only projection going on and a poor excuse for model and camera transforms. Perfect to isolate. Then we apply the clipping (in world space actually), to see how we can apply it.

Next I want to create another one that actually uses a Mat4 setup, since then we can perform clipping in the "clipping space", right after we apply the projection matrix but before we actually divide by w (effectively z), which is the best moment to clip - apparently.
# near-plane-clipping-mat4
