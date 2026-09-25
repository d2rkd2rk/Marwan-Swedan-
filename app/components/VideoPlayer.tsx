'use client';

import {useEffect,useRef,useState} from 'react';

type Props={
  src:string;
  savedSeconds?:number;
  onTimeUpdate?:(currentTime:number,duration:number)=>void;
  onPause?:(currentTime:number)=>void;
  onEnded?:(duration:number)=>void;
};

const formatTime=(seconds:number)=>{
  const s=Math.max(0,Math.floor(seconds||0));
  return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
};

export default function VideoPlayer({src,savedSeconds=0,onTimeUpdate,onPause,onEnded}:Props){
  const playerRef=useRef<HTMLDivElement|null>(null);
  const videoRef=useRef<HTMLVideoElement|null>(null);
  const lastTapRef=useRef<{time:number;x:number}>({time:0,x:0});
  const [playing,setPlaying]=useState(false);
  const [muted,setMuted]=useState(false);
  const [volume,setVolume]=useState(1);
  const [current,setCurrent]=useState(0);
  const [duration,setDuration]=useState(0);
  const [fullscreen,setFullscreen]=useState(false);
  const [downloadMessage,setDownloadMessage]=useState(false);
  const [captureWarning,setCaptureWarning]=useState(false);
  const [seekFeedback,setSeekFeedback]=useState<'forward'|'backward'|null>(null);
  const [controlsVisible,setControlsVisible]=useState(true);
  const hideControlsTimer=useRef<number|null>(null);

  useEffect(()=>{
    const video=videoRef.current;
    if(!video)return;
    const handleLoaded=()=>{
      setDuration(video.duration||0);
      if(savedSeconds>0&&savedSeconds<video.duration-2)video.currentTime=savedSeconds;
    };
    const handlePlay=()=>setPlaying(true);
    const handlePause=()=>setPlaying(false);
    const handleTime=()=>{
      setCurrent(video.currentTime);
      onTimeUpdate?.(video.currentTime,video.duration||0);
    };
    const handleEnd=()=>{setPlaying(false);onEnded?.(video.duration||0)};
    video.addEventListener('loadedmetadata',handleLoaded);
    video.addEventListener('play',handlePlay);
    video.addEventListener('pause',handlePause);
    video.addEventListener('timeupdate',handleTime);
    video.addEventListener('ended',handleEnd);
    return()=>{
      video.removeEventListener('loadedmetadata',handleLoaded);
      video.removeEventListener('play',handlePlay);
      video.removeEventListener('pause',handlePause);
      video.removeEventListener('timeupdate',handleTime);
      video.removeEventListener('ended',handleEnd);
    };
  },[savedSeconds,onTimeUpdate,onEnded]);

  const resetControlsTimer=()=>{
    setControlsVisible(true);
    if(hideControlsTimer.current!==null)window.clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current=window.setTimeout(()=>setControlsVisible(false),3000);
  };

  useEffect(()=>()=>{if(hideControlsTimer.current!==null)window.clearTimeout(hideControlsTimer.current);},[]);

  const togglePlay=()=>{
    const video=videoRef.current;
    if(!video)return;
    if(video.paused)video.play().catch(()=>{});
    else video.pause();
  };

  const seek=(value:number)=>{
    const video=videoRef.current;
    if(!video||!Number.isFinite(video.duration))return;
    const next=Math.max(0,Math.min(value,video.duration));
    video.currentTime=next;
    setCurrent(next);
  };

  const seekBy=(seconds:number)=>{
    const video=videoRef.current;
    if(!video||!Number.isFinite(video.duration))return;
    seek(video.currentTime+seconds);
    setSeekFeedback(seconds>0?'forward':'backward');
    window.setTimeout(()=>setSeekFeedback(null),550);
  };

  const changeVolume=(value:number)=>{
    const video=videoRef.current;
    if(!video)return;
    video.volume=value;
    video.muted=value===0;
    setVolume(value);
    setMuted(value===0);
  };

  const changeVolumeBy=(amount:number)=>{
    const video=videoRef.current;
    if(!video)return;
    changeVolume(Math.max(0,Math.min(1,video.volume+amount)));
  };

  const toggleMute=()=>{
    const video=videoRef.current;
    if(!video)return;
    video.muted=!video.muted;
    setMuted(video.muted);
    if(!video.muted&&video.volume===0){video.volume=.8;setVolume(.8);}
  };

  const handlePlayerInteraction=()=>resetControlsTimer();

  const handleVideoDoubleTap=(e:React.MouseEvent<HTMLVideoElement>)=>{
    resetControlsTimer();
    const now=Date.now();
    const rect=e.currentTarget.getBoundingClientRect();
    const x=e.clientX-rect.left;
    const previous=lastTapRef.current;
    if(now-previous.time<320){
      seekBy(x<rect.width/2?-5:5);
      lastTapRef.current={time:0,x:0};
    }else{
      lastTapRef.current={time:now,x};
    }
  };

  useEffect(()=>{
    const handleKey=(e:KeyboardEvent)=>{
      const target=e.target as HTMLElement|null;
      if(target?.tagName==='INPUT'||target?.tagName==='TEXTAREA'||target?.isContentEditable)return;
      const video=videoRef.current;
      if(!video)return;
      if(e.key==='ArrowRight'){e.preventDefault();seekBy(5);}
      else if(e.key==='ArrowLeft'){e.preventDefault();seekBy(-5);}
      else if(e.key==='ArrowUp'){e.preventDefault();changeVolumeBy(.1);}
      else if(e.key==='ArrowDown'){e.preventDefault();changeVolumeBy(-.1);}
      else if(e.key===' '){e.preventDefault();togglePlay();}
      else if(e.key.toLowerCase()==='m'){e.preventDefault();toggleMute();}
      else if(e.key.toLowerCase()==='f'){e.preventDefault();toggleFullscreen();}
    };
    window.addEventListener('keydown',handleKey);
    return()=>window.removeEventListener('keydown',handleKey);
  },[]);

  useEffect(()=>{
    const handleCaptureKey=(e:KeyboardEvent)=>{
      const key=e.key.toLowerCase();
      if(e.key==='PrintScreen'||(e.metaKey&&e.shiftKey&&key==='3')||(e.metaKey&&e.shiftKey&&key==='4')){
        e.preventDefault();
        setCaptureWarning(true);
        window.setTimeout(()=>setCaptureWarning(false),1800);
      }
    };
    window.addEventListener('keydown',handleCaptureKey);
    return()=>window.removeEventListener('keydown',handleCaptureKey);
  },[]);

  useEffect(()=>{
    const handleFullscreenChange=()=>setFullscreen(document.fullscreenElement===playerRef.current);
    document.addEventListener('fullscreenchange',handleFullscreenChange);
    return()=>document.removeEventListener('fullscreenchange',handleFullscreenChange);
  },[]);

  const showDownloadMessage=()=>{
    setDownloadMessage(true);
    window.setTimeout(()=>setDownloadMessage(false),5000);
  };

  const toggleFullscreen=async()=>{
    const wrapper=playerRef.current;
    if(!wrapper)return;
    if(document.fullscreenElement){
      await document.exitFullscreen().catch(()=>{});
      return;
    }
    try{
      await wrapper.requestFullscreen();
      const orientation=screen.orientation as ScreenOrientation & {lock?:(orientation:string)=>Promise<void>;unlock?:()=>void};
      if(orientation.lock)await orientation.lock('landscape').catch(()=>{});
    }catch{}
  };

  return <div
    ref={playerRef}
    className={`customVideoPlayer ${controlsVisible?'controlsVisible':'controlsHidden'}`}
    onPointerDown={handlePlayerInteraction}
    onContextMenu={e=>e.preventDefault()}
    onDragStart={e=>e.preventDefault()}
  >
    <video
      ref={videoRef}
      src={src}
      preload="metadata"
      playsInline
      controls={false}
      disablePictureInPicture
      controlsList="nodownload noremoteplayback"
      className="customVideo"
      onDoubleClick={handleVideoDoubleTap}
      onPause={()=>{if(videoRef.current)onPause?.(videoRef.current.currentTime)}}
    />
    <div className="videoWatermark" aria-hidden="true"><div>PROTECTED CONTENT • MARWAN SWEDAN ACADEMY</div><div className="videoWatermarkUser">{typeof window !== "undefined" ? (document.body.dataset.username || "") : ""}</div></div>
    {seekFeedback&&<div className={`videoSeekFeedback ${seekFeedback}`} aria-hidden="true">{seekFeedback==='forward'?'⏩ +5':'⏪ -5'}</div>}
    {captureWarning&&<div className="captureShield" role="status" aria-live="polite">Screenshot / screen capture is disabled here.</div>}
    {downloadMessage&&<div className="downloadNotice" role="status" aria-live="polite">ممنوع الداونلوود يا سكر انا بتاع سكيوريتي مش بتاع كفتة😍</div>}
    <div className="customVideoControls">
      <button type="button" className="videoControlButton" onClick={togglePlay} aria-label={playing?'Pause':'Play'}>{playing?'❚❚':'▶'}</button>
      <button type="button" className="videoControlButton" onClick={()=>seekBy(-5)} aria-label="Back 5 seconds" title="Back 5 seconds">↶5</button>
      <button type="button" className="videoControlButton" onClick={()=>seekBy(5)} aria-label="Forward 5 seconds" title="Forward 5 seconds">5↷</button>
      <button type="button" className="videoControlButton" onClick={toggleMute} aria-label={muted?'Unmute':'Mute'}>{muted?'🔇':'🔊'}</button>
      <input className="videoSeek" type="range" min="0" max={Math.max(duration,0.01)} step="0.1" value={Math.min(current,duration||0)} onChange={e=>seek(Number(e.target.value))} aria-label="Video progress"/>
      <span className="videoTime">{formatTime(current)} / {formatTime(duration)}</span>
      <button type="button" className="videoControlButton videoDownloadButton" onClick={showDownloadMessage} aria-label="Download disabled" title="Download disabled">⇩</button>
      <input className="videoVolume" type="range" min="0" max="1" step="0.05" value={muted?0:volume} onChange={e=>changeVolume(Number(e.target.value))} aria-label="Volume"/>
      <button type="button" className="videoControlButton" onClick={toggleFullscreen} aria-label="Fullscreen">{fullscreen?'⤢':'⛶'}</button>
    </div>
  </div>;
}
