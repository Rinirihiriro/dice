elementIds = ["vecx", "vecy", "rotx", "roty", "rotz", "dice"];
e = {};
canv = null;
img = new Image();
img.src = "dice.png";
img_shadow = new Image();
img_shadow.src = "dice_shadow.png";

border = 20;

x = 0;
y = 4;

vecX = new Vec(1, 0, 0);
vecY = new Vec(0, 1, 0);
// vecZ = new Vec(0, 0, 1);

vecPivot = null;

rotX = 0;
rotY = 0;
rotZ = 0;

mouseX = 0;
mouseY = 0;
mouseDrag = false;

log = [0];

dice = {
	x: 150,
	y: 150,
	z: 0,
	vx: 0,
	vy: 0,
	vz: 0,
	va: new Vec(0,0,0), // 각속도

	old: {},
	checkTimer: 0,

	init: function(){
		vecX = new Vec(1, 0, 0);
		vecY = new Vec(0, 1, 0);
		this.x = 150;
		this.y = 150;
		this.z = 0;
		this.vx = 0;
		this.vy = 0;
		this.vz = 0;
		this.va = new Vec(0,0,0);

		this.old = {z:0, vz:0, vasize:0};
		this.checkTimer = 0;
	},

	update: function(){
		
		// 바닥과 충돌 검사
		
		var vecZ = vecX.cross(vecY);
		for (var i = -1; i <= 1; i+=2)
		{
			for (var j = -1; j <= 1; j+=2)
			{
				for (var k = -1; k <= 1; k+=2)
				{
					var point = new Vec(i*vecX.x+j*vecY.x+k*vecZ.x, i*vecX.y+j*vecY.y+k*vecZ.y, i*vecX.z+j*vecY.z+k*vecZ.z);
					if (this.z+point.z < -1)
					{
						var torque = point.cross(new Vec(0,0,1));
						torque.normalize();
						torque = torque.mul((Math.max(0,-this.vz)+Math.max(0, this.va.dot(torque.mul(-1))))*0.5 + 0.1);
						this.va = this.va.add(torque);
						// this.z = -1-point.z;
					}
				}
			}
		}

		rotateDice(this.va, this.va.size()/10);
		
		if (this.z > 10)
			this.z = 10;
		if (this.z > 0)
			this.vz -= 0.16;
		this.x += this.vx;
		this.y += this.vy;
		this.z += this.vz;

		if (this.x < border)
		{
			this.x = border;
			if (this.vx < 0)
				this.vx = -this.vx*0.5;
		}
		if (this.x > e.dice.width-border)
		{
			this.x = e.dice.width-border;
			if (this.vx > 0)
				this.vx = -this.vx*0.5;
		}
		if (this.y < border)
		{
			this.y = border;
			if (this.vy < 0)
				this.vy = -this.vy*0.5;
		}
		if (this.y > e.dice.height-border)
		{
			this.y = e.dice.height-border;
			if (this.vy > 0)
				this.vy = -this.vy*0.5;
		}

		if (this.z <= 0)
		{
			this.z = 0;
			if (this.vz < 0)
				this.vz = -this.vz;

			this.vx *= 0.5;
			if (Math.abs(this.vx) < 0.01)
				this.vx = 0;
			
			this.vy *= 0.5;
			if (Math.abs(this.vy) < 0.01)
				this.vy = 0;

			this.vz *= 0.5;
			if (Math.abs(this.vz) < 0.01)
				this.vz = 0;

			if (this.va.size() < 0.01)
			{
				this.va = new Vec(0,0,0);
				this.stablize();
			}
		}

		if (this.checkTimer == 0)
		{
			if (this.old.z < 0.5 && this.z < 0.5)
				this.z = 0;
			if (Math.abs(this.old.vz) < 0.5 && Math.abs(this.vz) < 0.5)
				this.vz = 0;
			if (this.z == 0 && this.old.vasize < 0.3 && this.va.size() < 0.3)
			{
				this.va = new Vec(0,0,0);
				this.stablize();
			}
			this.old.z = this.z;
			this.old.vz = this.vz;
			this.old.vasize = this.va.size();
			this.checkTimer = 10;
		}
		else
			this.checkTimer -= 1;
	},

	stablize: function(){
		/*
			둘 다 XY축이나 Z축에 투영해버리니까 축의 방향이 같아져버리는 현상이 발생...
			...은 0.5로 비교해서 그런듯
			if (Math.abs(vecX.z) < 0.5)
			이렇게 하면 안 됨... 1.414(Math.sqrt(2))라면 모를까... 가장 좋은 건 XY투영이랑 Z투영을 비교하는 것
			... 그래도 버그 발생
			축 하나는 기존 그대로 투영하고, 나머지 하나는 투영했을 때 버그가 발생하면 다른 쪽으로 투영하는 것으로 해결
		*/
		var xy;
		xy = new Vec(vecX.x, vecX.y, 0);
		if (Math.abs(vecX.z) <= xy.size())
			vecX = xy.normalize();
		else
			vecX = new Vec(0,0,vecX.z > 0 ? 1 : -1);

		xy = new Vec(vecY.x, vecY.y, 0);
		if (Math.abs(vecY.z) <= xy.size() && Math.abs(xy.dot(vecX)) < 0.01 || vecX.z != 0)
			vecY = xy.normalize();
		else
			vecY = new Vec(0,0,vecY.z > 0 ? 1 : -1);
	},
};

function Vec(x, y, z)
{
	this.x = x;
	this.y = y;
	this.z = z;
}

Vec.prototype.clone = function()
{
	return new Vec(this.x, this.y, this.z);
}

Vec.prototype.size = function()
{
	return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
}

Vec.prototype.normalize = function()
{
	var size = this.size();
	if (size == 0)
		return this;

	this.x /= size;
	this.y /= size;
	this.z /= size;

	return this;
}

Vec.prototype.add = function(other)
{
	if (typeof other == "object")
	{
		return new Vec(this.x+other.x, this.y+other.y, this.z+other.z);
	}
	return undefined;
}

Vec.prototype.mul = function(num)
{
	return new Vec(this.x*num, this.y*num, this.z*num);
}

Vec.prototype.dot = function(other)
{
	if (typeof other == "object")
	{
		return this.x*other.x + this.y*other.y + this.z*other.z;
	}
	return undefined;
}

Vec.prototype.cross = function(other)
{
	if (typeof other == "object")
	{
		return new Vec(this.y*other.z - this.z*other.y, this.z*other.x - this.x*other.z, this.x*other.y - this.y*other.x);
	}
	return undefined;
}

Vec.prototype.rotateX = function(angle)
{
	var sina = Math.sin(angle), cosa = Math.cos(angle);
	return new Vec(this.x, this.y*cosa-this.z*sina, this.y*sina+this.z*cosa);
}

Vec.prototype.rotateY = function(angle)
{
	var sina = Math.sin(angle), cosa = Math.cos(angle);
	return new Vec(this.x*cosa+this.z*sina, this.y, -this.x*sina+this.z*cosa);
}

Vec.prototype.rotateZ = function(angle)
{
	var sina = Math.sin(angle), cosa = Math.cos(angle);
	return new Vec(this.x*cosa-this.y*sina, this.x*sina+this.y*cosa, this.z);
}


var rotSpeed = 22.5;
function onLoad()
{
	for (var i = 0; i < elementIds.length; i++)
		e[elementIds[i]] = document.getElementById(elementIds[i]);
	canv = e.dice.getContext("2d");

	dice.init();

	setInterval(update, 16);

	addEventListener("keydown", function(e){
		if (e.keyCode == 36)
		{
			dice.init();
		}
		else if (e.keyCode == 32)
		{
			dice.vz = 2;
		}
		/*
		switch(e.keyCode)
		{
			case 37: // LEFT
				rotY -= rotSpeed;
				break;
			case 38: // UP
				rotX -= rotSpeed;
				break;
			case 39: // RIGHT
				rotY += rotSpeed;
				break;
			case 40: // DOWN
				rotX += rotSpeed;
				break;
			
			case 81: // Q
				rotZ += rotSpeed;
				break;
			case 87: // W
				rotZ -= rotSpeed;
				break;
		}
		rotX = Math.max(Math.min(rotX, 90), -90);
		rotY = (rotY + 360 + 180) % 360 - 180;
		rotZ = (rotZ + 360 + 180) % 360 - 180;
		*/
	});

	addEventListener("mousedown", function(e){
		mouseX = e.clientX;
		mouseY = e.clientY;
		mouseDrag = true;
	});

	addEventListener("mouseup", function(e){
		mouseDrag = false;
	});

	addEventListener("mousemove", function(e){
		var dx, dy, vecDir;

		if (!mouseDrag)
			return;

		dx = e.clientX - mouseX;
		dy = e.clientY - mouseY;
		vecDir = new Vec(dx, -dy, 0);

		dice.vx += dx/10;
		dice.vy += dy/10;
		
		if (vecDir.size() == 0)
			return;

		vecDir.normalize();
		vecPivot = vecDir.cross(new Vec(0, 0, -1));

		/*
			Z축을 vecPivot으로 회전 -> Z축으로 회전 -> Z축 원상복귀

			vecPivot은 언제나 XY평면 위에 존재한다.
			즉, vecPivot을 Z축 회전해서 Y축으로 옮기고 Y축 회전하면 된다.
			(x, y, z) -> (xc+ys, -xs+yc, z)
	
			Y축 회전
			(x, y, z) -> (xc+zs, y, -xs+zc)

			복귀
			(x, y, z) -> (xc-ys, xs+yc, z)
		*/
		/*
		var th = Math.acos(vecPivot.y);
		if (vecPivot.x > 0) th = -th;
		var sinth = Math.sin(th);
		var costh = Math.cos(th);
		
		var th2 = vecDir.size()/20;
		var sinth2 = Math.sin(th2);
		var costh2 = Math.cos(th2);

		vecX = new Vec(vecX.x*costh+vecX.y*sinth, -vecX.x*sinth+vecX.y*costh, vecX.z);
		vecX = new Vec(vecX.x*costh2+vecX.z*sinth2, vecX.y, -vecX.x*sinth2+vecX.z*costh2);
		vecX = new Vec(vecX.x*costh-vecX.y*sinth, vecX.x*sinth+vecX.y*costh, vecX.z);

		vecY = new Vec(vecY.x*costh+vecY.y*sinth, -vecY.x*sinth+vecY.y*costh, vecY.z);
		vecY = new Vec(vecY.x*costh2+vecY.z*sinth2, vecY.y, -vecY.x*sinth2+vecY.z*costh2);
		vecY = new Vec(vecY.x*costh-vecY.y*sinth, vecY.x*sinth+vecY.y*costh, vecY.z);

		vecX.normalize();
		vecY.normalize();
		*/

		rotateDice(vecPivot, vecDir.size()/20);

		mouseX = e.clientX;
		mouseY = e.clientY;

		e.preventDefault();
	});
}

function update()
{
	dice.update();
	/*
	log.push(dice.va.size());
	if (log.length > 100)
		log.splice(0,log.length-100);
	*/
	canv.clearRect(0,0,e.dice.width,e.dice.height);
	drawDice();
//	drawLog();
}

function drawDice()
{
	var rot = 0;
	var vecX2, vecY2;
	var s, c;

	/*
		스프라이트 자체가 Y축 회전 -> X축 회전 -> Z축 회전 순서로 변형되도록 만들어졌음.
		여기서는 반대로 이미 변형된 물체를 가지고 Z축 회전 -> X축 회전 -> Y축 회전을 해서 원래 상태로 돌아가는 과정을 통해
		X, Y, Z의 회전각을 알아냄 이걸 구하면 이에 맞는 스프라이트를 가져올 수 있음. (Z 회전각은 그냥 스프라이트 자체를 회전함)
		회전각의 범위는 각각 -180~180, -90~90, -180~180
		Z와 X 회전각은 변형된 Y축을 통해서 알아낼 수 있음.
		변형된 Y축을 XY평면에 투영한 뒤 정규화하면 원래 Y축이 Z축 회전된 위치가 나옴
		또한, 변형된 Y축과 XY평면사이의 각이 X축 회전각이 됨.
		(Y축 회전시에는 Y축이 변하지 않음 -> X축 회전으로 Y축과 XY평면사이 각이 생김 Y축은 ZY평면 위에 존재함 -> Z축 회전을 해도 Y축과 XY평면 사이의 각은 변하지 않음.)
		X, Z 회전각을 알아냈으므로 Z->X 역회전. Y축 회전만 남는다.
		Y축 회전은 변형된 X축을 가지고 바로 알아낼 수 있다. (맨 처음에 Y축 회전한 상태로 만든 것이므로)
	*/

	rotX = Math.asin(vecY.z)*180/Math.PI;

	vecY2 = new Vec(vecY.x, vecY.y, 0);
	vecY2.normalize();
	rotZ = Math.acos(vecY2.y)*180/Math.PI
	if (vecY2.x > 0) rotZ = -rotZ;

	c = vecY2.y;
	s = Math.sin(rotZ*Math.PI/180);
	vecX2 = new Vec(vecX.x*c+vecX.y*s, -vecX.x*s+vecX.y*c, vecX.z);

	s = vecY.z;
	c = Math.sqrt(1-s*s);
	vecX2 = new Vec(vecX2.x, vecX2.y*c+vecX2.z*s, -vecX2.y*s+vecX2.z*c);

	rotY = Math.acos(vecX2.x)*180/Math.PI;
	if (vecX2.z > 0) rotY = -rotY;

	/*
	if (rotX > 90 || rotX < -90)
	{
		rotX = rotX > 0 ? 180 - rotX : -180 - rotX;
		rotY = (rotY + 180 + 180) % 360 - 180;
		rotZ = (rotZ + 180 + 180) % 360 - 180;
	}
	*/

	e.vecx.innerText = "vecX: (" + Math.round(vecX.x*100)/100 + ", " + Math.round(vecX.y*100)/100 + ", " + Math.round(vecX.z*100)/100 + ")";
	e.vecy.innerText = "vecY: (" + Math.round(vecY.x*100)/100 + ", " + Math.round(vecY.y*100)/100 + ", " + Math.round(vecY.z*100)/100 + ")";
	e.rotx.innerText = "rotX: " + Math.round(rotX*100)/100;
	e.roty.innerText = "rotY: " + Math.round(rotY*100)/100;
	e.rotz.innerText = "rotZ: " + Math.round(rotZ*100)/100;

	y = Math.round(rotX / 22.5) + 4;
	x = (Math.round(-(rotY-180) / 22.5) + 8) % 16;

	if (y == 0 || y == 8)
		x = 0;
	if (y == 0)
		rot = rotY;
	if (y == 8)
		rot = -rotY;
	
	// 개념상 회전방향은 반시계인데, 캔버스는 시계방향으로 회전시켜서 방향을 반대로 잡아줌.
	rot -= rotZ;
	rot = Math.round(rot/22.5)*22.5;

	canv.drawImage(img_shadow, dice.x-21 + dice.z*4, dice.y-18 + dice.z*4);
	canv.save();
	canv.translate(dice.x, dice.y);
	canv.rotate(rot*Math.PI/180);
	canv.scale(1+dice.z/10, 1+dice.z/10);
	canv.translate(-dice.x, -dice.y);
	canv.drawImage(img, x*46, y*46, 46, 46, dice.x-23, dice.y-23, 46, 46);
	canv.restore();

/*
	canv.lineWidth = 2;

	canv.strokeStyle = "red";
	canv.beginPath();
	canv.moveTo(25, 25);
	canv.lineTo(25+vecX.x*20, 25-vecX.y*20);
	canv.stroke();
	
	canv.strokeStyle = "blue";
	canv.beginPath();
	canv.moveTo(25, 25);
	canv.lineTo(25+vecY.x*20, 25-vecY.y*20);
	canv.stroke();

	var vecZ = vecX.cross(vecY);

	canv.strokeStyle = "green";
	canv.beginPath();
	canv.moveTo(25, 25);
	canv.lineTo(25+vecZ.x*20, 25-vecZ.y*20);
	canv.stroke();
*/
/*
	if (mouseDrag && vecPivot)
	{
		canv.strokeStyle = "grey";
		canv.beginPath();
		canv.moveTo(25, 25);
		canv.lineTo(25+vecPivot.x*20, 25-vecPivot.y*20);
		canv.stroke();
	}
*/
}

function rotateDice(pivot, angle)
{
	/*
		pivot으로 축 이동 -> X 회전 -> 축 복귀
		pivot은 ZXZ회전으로 이동
		축이동 행렬은 Rz2' Ry' Rz1' 행렬이다.
		즉, X축을 pivot으로 이동시키는 행렬의 역행렬이다.
		Rz1의 회전각을 a
		Ry의 회전각을 b
		Rz2의 회전각을 c라고 한다.
		a는 pivot을 XY평면에 투영하면 나온다.
		b는 XY평면에 투영된 pivot과 pivot으로 생성되는 평면의 normal벡터와 Z축 사이의 각이다. normal은 투영된 pivot x pivot으로 구한다.
		... 이 값은 90, 0, -90 셋 중 하나가 된다.
		pivot의 Z값에 따라 +면 90, 0이면 0, -면 -90이 된다.
		c는 XY평면에 투영된 pivot과 pivot사이의 각이다.
	*/

	if (angle == 0)
		return;

	var a, b, c;
	var piv = pivot.clone().normalize();
	var proj = (new Vec(pivot.x, pivot.y, 0)).normalize();
	var normal = proj.cross(piv);
	
	a = Math.acos(proj.x);
	if (proj.y < 0) a = -a;

	b = piv.z == 0 ? 0 : piv.z > 0 ? Math.PI/2 : -Math.PI/2;

	c = Math.acos(Math.min(Math.max(piv.dot(proj), -1), 1));

	vecX = vecX.rotateZ(-a).rotateX(-b).rotateZ(-c);
	vecX = vecX.rotateX(angle);
	vecX = vecX.rotateZ(c).rotateX(b).rotateZ(a);

	vecY = vecY.rotateZ(-a).rotateX(-b).rotateZ(-c);
	vecY = vecY.rotateX(angle);
	vecY = vecY.rotateZ(c).rotateX(b).rotateZ(a);

	vecX.normalize();
	vecY.normalize();
}


function drawLog()
{
	var max, min;
	canv.lineWidth = 1;
	canv.strokeStyle = "black";
	canv.beginPath();
	canv.moveTo(0, 150-log[0]*3);
	max = min = log[0];
	for (var i = 1; i < log.length; i++)
	{
		canv.lineTo(i*3, 150-log[i]*3);
		if (max < log[i])
			max = log[i];
		if (min > log[i])
			min = log[i];
	}
	canv.stroke();
	canv.fillStyle = "black";
	canv.font = "12px sans-serif"

	canv.fillText(max, 5, 150-3);
	canv.fillText(min, 5, 150+15);
}
