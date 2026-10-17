import {test} from 'node:test';
import assert from 'node:assert/strict';
import {guideCar} from './driving-assist.mjs';

const road={a:0,x:0,y:0,distance:0,width:15};

test('a light correction aligns a moving car to the road and recenters it',()=>{
 let angle=.3,release=0;
 for(let i=0;i<60;i++)({angle,release}=guideCar(angle,0,0,20,0,road,release,1/60));
 assert.ok(Math.abs(angle)<.04);
 const offset=guideCar(0,0,3,20,0,{...road,distance:3},0,.05);
 assert.ok(offset.angle<0,'the guide points back toward the centre');
});

test('a committed turn releases assistance long enough to choose a street or mount a sidewalk',()=>{
 const turn=guideCar(.3,0,0,20,.8,road,0,.05);
 assert.equal(turn.angle,.3);
 assert.ok(turn.release>.8);
 const after=guideCar(.3,0,0,20,0,road,turn.release,.05);
 assert.equal(after.angle,.3,'releasing the stick does not pull the car back at once');
 assert.equal(guideCar(1.2,0,0,20,0,road,0,.05).angle,1.2,'perpendicular turn is never snapped back');
 assert.equal(guideCar(.3,0,0,-8,0,road,0,.05).angle,.3,'reverse is free');
});
