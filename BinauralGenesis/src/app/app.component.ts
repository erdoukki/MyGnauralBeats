import { Component, OnInit } from '@angular/core';
import { Http } from '@angular/http'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

//export class BB_Description {
//  frequencyMin: number;
//  frequencyMax: number;

//  label: string;
//  description: string;
//}

export class AppComponent implements OnInit {
  constructor(private _httpService: Http) {

  }

  helpDescription: string =
  `Binaural Beats are an auditory illusion caused by playing two tones of slightly different frequency.
  When listened to with headphones, the mind interprets it as a single rhythmic tone at a frequency identical
  to the difference in the two tone's frequencies.  This illusion is thought to change the predominant neural frequency
  of the mind (delta, theta, beta, gamma) in a way that might impact one's state of mind.
  Popular for those looking to enhance focus, relaxation, or at least harness the placebo effect to their advantage.
  Read more about it at https://www.wikipedia.org/wiki/Binaural_beats`;

  isPlaying: boolean = false;
  volumeLevel: number = 0;
  leftFrequency: number = 100.0;
  rightFrequency: number = 107.83;

  private volumeRampUp: number = 0.25;
  private volumeRampDown: number = 0.1;

  private audioContext: AudioContext;
  private leftOscillator: OscillatorNode;
  private rightOscillator: OscillatorNode;
  private merger: ChannelMergerNode;
  private gain: GainNode;

  ngOnInit() {
    this.initializeAudioPipeline();
  }

  initializeAudioPipeline() {
    this.audioContext = new AudioContext();

    this.merger = this.audioContext.createChannelMerger(2);
    this.gain = this.audioContext.createGain();

    this.merger.connect(this.gain);
    this.gain.connect(this.audioContext.destination);
  }

  getBinauralFrequency(): number {
    return Math.abs(this.leftFrequency - this.rightFrequency);
  }
  
  updateOnDrag(leftFrequency: number, rightFrequency: number, volume: number) {
    if (!(leftFrequency === undefined))
      this.leftFrequency = leftFrequency;

    if (!(rightFrequency === undefined))
      this.rightFrequency = rightFrequency;

    if (!(volume === undefined))
      this.volumeLevel = volume;
  }

  updateFrequencyAndVolume() {
    //Used to reduce overall gain range from 0->1 to 0->N.  For hearing safety.
    const volumeScalingFactor: number = 0.33;

    //note: oscillators can only be started once, so we need to re-create & recconnect them every time.  Lame.
    this.connectBinauralOscillators();

    this.leftOscillator.connect(this.merger, 0, 0);
    this.rightOscillator.connect(this.merger, 0, 1);


    var safeVolume: number = Math.min((this.volumeLevel / 100) * volumeScalingFactor, 1); //Don't allow crazy effin' volumes.

    this.gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.gain.gain.setTargetAtTime(safeVolume, this.audioContext.currentTime + this.volumeRampUp, 0.5);
  }

  private disconnectFromMerger(node: OscillatorNode, ev: MediaStreamErrorEvent): any {
    node.disconnect(this.merger);
  }

  private connectBinauralOscillators() {
    //first, disconnect old oscillators
    if (typeof this.leftOscillator !== "undefined") {
      this.leftOscillator.disconnect(this.merger);
      this.rightOscillator.disconnect(this.merger);
    }

    this.leftOscillator = this.audioContext.createOscillator();
    this.rightOscillator = this.audioContext.createOscillator();
    this.leftOscillator.frequency.setTargetAtTime(this.leftFrequency, 0, 0);
    this.rightOscillator.frequency.setTargetAtTime(this.rightFrequency, 0, 0);
  }

  playPause() {
    //TODO: try keeping everything started at all times.
    //"Pausing" simply sets gain to 0, playing sets it to 'volumeLevel'... normalized for hearing safety, of course.
    this.isPlaying = !this.isPlaying;

    //if we need to play the audio
    if (this.isPlaying) {
      this.updateFrequencyAndVolume();
      this.leftOscillator.start();
      this.rightOscillator.start();
    }

    //if we need to pause the audio
    else {
      var currentTime = this.audioContext.currentTime;
      var stopTime = currentTime + 1;

      this.StopAudio(currentTime, stopTime);
    }
  }

  private StopAudio(currentTime: number, stopTime: number) {
    this.gain.gain.setTargetAtTime(0, currentTime, this.volumeRampDown);
    this.leftOscillator.stop(stopTime);
    this.rightOscillator.stop(stopTime);
  }

  getBeatInformation(): string { return "The jews did it"; }
}
