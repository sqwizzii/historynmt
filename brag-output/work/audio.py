import numpy as np, wave
sr=44100; D=21.5; n=int(sr*D)
t=np.arange(n)/sr
rng=np.random.default_rng(7)
def env(x,a,r):  # x seconds since start
    return np.clip(x/a,0,1)*np.exp(-np.clip(x-a,0,None)/r)
def place(buf,sig,at,gain=1.0):
    i=int(at*sr); j=min(n,i+len(sig))
    if i<n: buf[i:j]+=sig[:j-i]*gain
def midi(m): return 440*2**((m-69)/12)
music=np.zeros(n); sfx=np.zeros(n)
bpm=96; beat=60/bpm
# pad: Am - F - C - G, 2 bars each ~ 5s
chords=[[57,60,64],[53,57,60],[48,55,64],[55,59,62]]
seg=D/4
for k,c in enumerate(chords):
    s0=k*seg
    m=(t>=s0)&(t<s0+seg+0.8)
    x=t[m]-s0
    e=np.clip(x/1.2,0,1)*np.clip((seg+0.8-x)/1.0,0,1)
    sig=sum(np.sin(2*np.pi*midi(p)*x)+0.4*np.sin(2*np.pi*midi(p)*2.003*x) for p in c)/len(c)
    music[m]+=sig*e*0.16
# sub bass root on each chord
for k,c in enumerate(chords):
    for b in range(int(seg/beat/2)):
        at=k*seg+b*beat*2
        x=np.arange(int(sr*beat*1.8))/sr
        place(music,np.sin(2*np.pi*midi(c[0]-24)*x)*env(x,.01,.5),at,0.22)
# kick + hat from 3s
for b in range(int((D-3)/beat)):
    at=3+b*beat
    x=np.arange(int(sr*.35))/sr
    f=50+90*np.exp(-x*30)
    k=np.sin(2*np.pi*np.cumsum(f)/sr)*np.exp(-x*9)
    place(music,k,at,0.5)
    h=rng.standard_normal(int(sr*.05))*np.exp(-np.arange(int(sr*.05))/sr*90)
    h=np.diff(h,prepend=0)
    place(music,h,at+beat/2,0.07)
# pluck arpeggio
scale=[69,72,76,72,77,81,79,76]
for b in range(int((D-0.5)/(beat/2))):
    at=0.5+b*beat/2
    p=scale[b%8]+(-5 if (at//seg)%4==3 else 0)
    x=np.arange(int(sr*.5))/sr
    sig=(np.sin(2*np.pi*midi(p)*x)+.3*np.sin(2*np.pi*midi(p)*2*x))*env(x,.004,.12)
    place(music,sig,at,0.07 if at<3 else 0.09)
# fade music in/out
music*=np.clip(t/0.6,0,1)*np.clip((D-t)/1.8,0,1)
# whooshes at transitions
for b in [3,7,11.5,15.5,18.5]:
    ln=int(sr*.6); x=np.arange(ln)/sr
    nz=rng.standard_normal(ln)
    # simple band sweep via moving-average lowpass of varying length approximated by cumulative filter
    k=np.cumsum(nz); k=k-np.convolve(k,np.ones(200)/200,'same')
    sig=np.diff(k,prepend=0); sig/=np.abs(sig).max()+1e-9
    sig=sig*np.sin(np.pi*x/.6)**2
    place(sfx,sig,b-.3,0.16)
# clicks (UI) and flip
def click(at,g=.25):
    x=np.arange(int(sr*.08))/sr
    place(sfx,np.sin(2*np.pi*1800*x)*np.exp(-x*70)*.7+rng.standard_normal(len(x))*np.exp(-x*120)*.2,at,g)
click(9.6); click(13.3)
# counter ticks
for i in range(14):
    at=15.8+eo if False else 15.8+i*0.11
    x=np.arange(int(sr*.03))/sr
    place(sfx,np.sin(2*np.pi*(1200+i*60)*x)*np.exp(-x*150),at,0.05)
# outro hit
x=np.arange(int(sr*1.6))/sr
hit=(np.sin(2*np.pi*55*x)*np.exp(-x*3)+0.5*np.sin(2*np.pi*110*x)*np.exp(-x*4))
place(sfx,hit,18.6,0.45)
mix=music+sfx
mix=np.tanh(mix*1.2)
mix/=max(1e-9,np.abs(mix).max())/0.85
st=np.stack([mix,mix],1)
with wave.open('audio.wav','wb') as w:
    w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr)
    w.writeframes((st*32767).astype(np.int16).tobytes())
