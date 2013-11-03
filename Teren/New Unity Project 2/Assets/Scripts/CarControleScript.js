#pragma strict

var wheelFL : WheelCollider;
var wheelFR : WheelCollider;
var wheelRL : WheelCollider;
var wheelRR : WheelCollider;

var wheelFLTrans : Transform;
var wheelFRTrans : Transform;
var wheelRLTrans : Transform;
var wheelRRTrans : Transform;

var minSpeed : float = -50;  //minimalna szybkość
var maxSpeed : float = 150;  //maksymalna szybkość
var speed : float;    //szybkość

private var friction : float;  //tarcie
private var forwardFrict : float;
private var slipFriction : float;
private var slipForwardFrict : float;

var lowSpeedSteerAngle : float = 10;
var highSpeedSteerAngle : float = 1;
var maxReverseSpeed : float = 50;
var decelleration : float = 30;   //zmniejszenie prędkości
var maxTorque : float = 50;  //maksymalny moment obrotowy
var breaking = 50;      //hamowanie
var braked : boolean = false;   //czy hamuje
var maxBrake : float = 100;    //maksymalna wartość hamowania

var centerOfMassY : float = -1.65;   //środek masy
var centerOfMassZ : float = 1.0;

function Start(){
	//ustawianie środka masy
	rigidbody.centerOfMass.y = centerOfMassY;    
	rigidbody.centerOfMass.z = centerOfMassZ;
	
	//ustawianie tarcia bocznego i przedniego
	forwardFrict = wheelRR.forwardFriction.stiffness;   
	friction = wheelRR.sidewaysFriction.stiffness;
	slipForwardFrict = 0.003;
	slipFriction = 0.001;
}

function FixedUpdate(){
	Movement();	
	BrakingCar();	
	SetWheelsAngle();	
	HandBrake();
}

function Movement(){
	speed = 6.3 * wheelRL.radius * wheelRL.rpm * 60/1000;    //ustawianie prędkości
	speed = Mathf.Round(speed);
	
	if(speed > -maxSpeed && speed < maxReverseSpeed && !braked){       //ograniczenie prędkości
		wheelRR.motorTorque = maxTorque * - Input.GetAxis("Vertical"); //ruch pojazdu
		wheelRL.motorTorque = maxTorque * - Input.GetAxis("Vertical");
	}else{
		wheelRR.motorTorque = 0;
		wheelRL.motorTorque = 0;
	}
}

function SetWheelsAngle(){
	var speedFactor = rigidbody.velocity.magnitude/minSpeed;
	var currentAngle = Mathf.Lerp(lowSpeedSteerAngle, highSpeedSteerAngle, speedFactor);
	
	currentAngle *= Input.GetAxis("Horizontal");
	
	wheelFL.steerAngle = currentAngle;
	wheelFR.steerAngle = currentAngle;         //przekazywanie kąta
}

function BrakingCar(){
	if(Input.GetButton("Vertical") == false){       //hamowanie jeśli nie jedzie
		wheelRR.brakeTorque = decelleration;
		wheelRL.brakeTorque = decelleration;
	} else {
		wheelRR.brakeTorque = 0;        
		wheelRL.brakeTorque = 0;
	}
}

function Update(){		
	Rotate(wheelFLTrans, wheelFL);            //Obrót kół
	Rotate(wheelFRTrans, wheelFR);
	Rotate(wheelRLTrans, wheelRL);
	Rotate(wheelRRTrans, wheelRR);
	
	//obrót koła przy skręcaniu
	wheelFLTrans.localEulerAngles.y = -wheelFL.steerAngle - wheelFLTrans.localEulerAngles.z;   
	wheelFRTrans.localEulerAngles.y = -wheelFR.steerAngle - wheelFRTrans.localEulerAngles.z;
}

//Obrót danego koła
function Rotate(wheelTrans : Transform, wheel : WheelCollider){
	wheelTrans.Rotate(wheel.rpm/60 * 360 * Time.deltaTime, 0, 0);
}

//Hamulec ręczny - spacja
function HandBrake(){
	if(Input.GetButton("Jump")){
		braked = true;
	} else {
		braked = false;
	}
	
	if(braked){
	//hamowanie
		wheelRR.brakeTorque = maxBrake;        
		wheelRL.brakeTorque = maxBrake;
		wheelRR.motorTorque = 0;
		wheelRL.motorTorque = 0; 
		
		Friction(slipForwardFrict, slipFriction);
	} else {
		Friction(forwardFrict, friction);
	}
}

//Tarcie
function Friction(currentForwardFrict : float, currentFriction : float){
	wheelRR.forwardFriction.stiffness = currentForwardFrict;
	wheelRL.forwardFriction.stiffness = currentForwardFrict;
	wheelRR.sidewaysFriction.stiffness = currentFriction;
	wheelRL.sidewaysFriction.stiffness = currentFriction;
}


 


