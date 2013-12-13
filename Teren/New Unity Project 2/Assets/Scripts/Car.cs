using UnityEngine;
using System.Collections;

using UnityEngine;
using System.Collections;

public enum WheelDrive 
{
	Front = 0,
	Back = 1,
	All = 2
}

public class Car : MonoBehaviour {
	
	public WheelCollider[] frontWheelColliders;  //tablica przednich zderzaczy kół
	public Transform[] frontWheelTransforms;  //tablica przednich modeli kół
	public WheelCollider[] rearWheelColliders;  //tablica tylnych zderzaczy kół
	public Transform[] rearWheelTransforms;  //tablica tylnych modeli kół
	
	WheelData[] Wheels;   //tablica kół
	
	public Vector3 shiftCentre = new Vector3(0.0f, -0.25f, 0.0f); //środek masy
	public float maxSteerAngle = 30.0f;   //maksymalny kąt obrotu kół
	
	public float suspensionDistance = 0.1f; // wartość ruchu zawieszenia
	public float springs = 1000.0f; // sprężyny zawieszenia
	public float dampers = 2f; // jak bardzo tłumione jest zawieszenie?
	public float wheelWeight = 2f; // waga koła
	public float fwdStiffness = 0.1f; // dla kół, określa poślizg
	public float swyStiffness = 0.1f; // dla kół, określa poślizg
	
	public float wheelRadius = 0.599f; // promień koła
	public float torque = 100f; // moc bazowa silnika
	public float brakeTorque = 1000f; // moc hamowania
	public WheelDrive wheelDrive = WheelDrive.Front; // koła prowadzące śa przednimi	
	public float shiftDownRPM = 1500.0f; // przesunie bieg w doł
	public float shiftUpRPM = 2500.0f; // przesunie bieg w górę
	public float idleRPM = 500.0f; // bezczynne (obroty na minutę)	
	float[] gears = new float[6]{ -10f, 9f, 6f, 4.5f, 3f, 2.5f }; //biegi
	public bool automatic = true; //jeśli skrzynia biegów jest automatyczna
	public int currentGear = 1; // bieżący bieg
	float shiftDelay = 0.0f;
	float wantedRPM = 0.0f; // liczba obrotów na minutę jaką silnik stara się osiągnąć
	float motorRPM = 0.0f;  //bieżąca liczba obrotów na minutę
	float maxRPM = 5500.0f;  //maksymalna liczba obrotów na minutę
	float newTorque = 0.0f;
	
	//Tabela wydajności przy określonej prędkości obrotowej
	float[] efficiencyTable = { 0.6f, 0.65f, 0.7f, 0.75f, 0.8f, 0.85f, 0.9f, 1.0f, 1.0f, 
		0.95f, 0.80f, 0.70f, 0.60f, 0.5f, 0.45f, 0.40f, 0.36f, 0.33f, 0.30f, 0.20f, 
		0.10f, 0.05f 
	};
	
	// skala wykładników dla tabeli
	float efficiencyTableStep = 250.0f;

	float resetTime = 5.0f;     //czas pozostały do resetowania kąta samochodu jak się przewrócił
	float steer = 0.0f;        //kąt sterowania
	float lowestSteerAtSpeed = 100.0f; 
	float highSpeedSteerAngle = 1;   
	float lowSpeedSteerAngle = 10.0f;  
	
	
	//Klasa informacji o kole
	class WheelData
	{
		public WheelCollider collider;  //zderzacz koła
		public Transform transform;  //model koła
		public bool isFront = false;  //czy koło przednie
		public float rotationX = 0.0f;   //obrót koła względem osi X
		public Vector3 startPosition;
	}

	//Ustawienia parametrów zderzacza kołowego (tarcie itp.)
	void InitializeWheelCollider(WheelCollider wc)
	{
		WheelCollider col = wc;
		col.suspensionDistance = suspensionDistance;
		JointSpring js = col.suspensionSpring;
		js.spring = springs;
		js.damper = dampers;
		col.suspensionSpring = js;
		col.mass = wheelWeight;
		
		WheelFrictionCurve fc = col.forwardFriction;
		fc.asymptoteValue = 5000.0f;
		fc.extremumSlip = 2.0f;
		fc.asymptoteSlip = 20.0f;
		col.forwardFriction = fc;
		
		fc = col.sidewaysFriction;
		fc.asymptoteValue = 7500.0f;
		fc.asymptoteSlip = 2.0f;
		fc.stiffness = swyStiffness;
		col.sidewaysFriction = fc;
	}
	
	void Start()
	{
		Wheels = new WheelData[4];

		InitializeWheels();
		
		rigidbody.centerOfMass = shiftCentre;  //ustawienie środka masy
	}

	void InitializeWheels()
	{
		int currentWheel = 0;

		foreach(Transform wheelT in frontWheelTransforms)
		{
			Wheels[currentWheel] = new WheelData();
			Wheels[currentWheel].transform = wheelT;
			Wheels[currentWheel].startPosition = wheelT.localPosition;
			currentWheel++;
		}
		
		foreach(Transform wheelT in rearWheelTransforms)
		{
			Wheels[currentWheel] = new WheelData();
			Wheels[currentWheel].transform = wheelT;
			Wheels[currentWheel].startPosition = wheelT.localPosition;
			currentWheel++;
		}
		
		currentWheel = 0;
		
		foreach(WheelCollider wheelC in frontWheelColliders)
		{
			InitializeWheelCollider(wheelC);
			Wheels[currentWheel].collider = wheelC;
			Wheels[currentWheel].isFront = true;
			currentWheel++;
		}
		
		foreach(WheelCollider wheelC in rearWheelColliders)
		{
			InitializeWheelCollider(wheelC);
			Wheels[currentWheel].collider = wheelC;
			Wheels[currentWheel].isFront = false;
			currentWheel++;
		}
	}
	
	void FixedUpdate()
	{
		Control ();       				
	}

	//Bieg w górę
	public void ShiftUp() 
	{
		float now = Time.timeSinceLevelLoad;
		
		if (now < shiftDelay) 
			return;
		
		if (currentGear < gears.Length - 1) {
			currentGear ++;
			
			shiftDelay = now + 1.0f;
		}
	}

	//Bieg w doł
	public void ShiftDown() 
	{
		float now = Time.timeSinceLevelLoad;
		
		if (now < shiftDelay) 
			return;
		
		if (currentGear > 0) {
			currentGear --;
			
			shiftDelay = now + 0.1f;
		}
	}

	//Kontrola ruchu samochodu
	void Control()
	{
		float delta = Time.fixedDeltaTime;           //Bieżący czas
		//steer *= Input.GetAxis("Horizontal");   //kąt sterowania pojazdem
		float accel = Input.GetAxis("Vertical");   //przyspieszenie pojazdu
		bool brake = Input.GetButton ("Jump");       //czy hamuje?

		var speedFactor = rigidbody.velocity.magnitude/lowestSteerAtSpeed;	
		var steer = Mathf.Lerp(lowSpeedSteerAngle,highSpeedSteerAngle,speedFactor);	
		steer *= Input.GetAxis("Horizontal");

		//jeśli bieżący bieg to 1 a przyspieszenie mniejsze od 0
		if(currentGear == 1 && accel < 0.0f)  
		{
			ShiftDown();
		}
		//jeśli bieżący bieg to 0 a przyspieszenie większe od 0
		else if(currentGear == 0 && accel > 0.0f)
		{
			ShiftUp();
		}
		//jeśli trzeba zwiększyć bieg ;)
		else if(motorRPM > shiftUpRPM && accel > 0.0f)
		{
			ShiftUp();
		}
		//jeśli bieżący bieg to 1 a liczba obrotów jest mniejsza od max.
		else if(motorRPM < shiftDownRPM && currentGear > 1)
		{
			ShiftDown();
		}

		//hamowanie jeśli przyspieszenie mniejsze od 0
		if(accel < 0 && newTorque < 0 || (accel > 0 && newTorque > 0))  
		{
			brake = true;
			accel = 0.0f;
			wantedRPM = 0.0f;
		}
		
		if(currentGear == 0)  //jeśli wsteczny to cofa
			accel = -accel;


		//Obliczanie liczby obrotów na minutę
		wantedRPM = (maxRPM * accel) * 0.1f + wantedRPM * 0.9f;
		
		float rpm = 0.0f;
		int motorizedWheels = 0;
		bool floorContact = false;
		
		foreach(WheelData wd in Wheels)
		{
			WheelHit hit;
			WheelCollider collider = wd.collider;
			
			if(!wd.isFront)
			{
				rpm += collider.rpm;
				motorizedWheels++;
			}

			//Obliczanie obrotu kół względem osi x
			wd.rotationX = Mathf.Repeat(wd.rotationX + delta * wd.collider.rpm * 360.0f / 60.0f, 360.0f);
			
			if(wd.isFront)  //Obrót kół przednich
			{
				wd.transform.localRotation = Quaternion.Euler(0.0f, 0.0f, wd.collider.steerAngle);
				wd.collider.steerAngle = steer;
			}
			else  //Obrót kół tylnich
			{
				wd.transform.localRotation = Quaternion.Euler (wd.rotationX, 0.0f, 0.0f);
			}
			
			Vector3 lp = wd.transform.localPosition;
			if(collider.GetGroundHit(out hit))
			{
				lp.z -= Vector3.Dot (wd.transform.position - hit.point, transform.up) - collider.radius;
				floorContact = floorContact || (!wd.isFront);
			}
			else
			{
				lp.z = wd.startPosition.z - suspensionDistance;
			}
			wd.transform.localPosition = lp;
		}
		
		if(motorizedWheels > 1)
		{
			rpm = rpm/motorizedWheels;   //kolejne modyfikacji liczby obrotów
		}

		//Obliczanie liczby obrotów na minutę uwzględniając mnożnik bieżącego biegu
		motorRPM = 0.95f * motorRPM + 0.05f * Mathf.Abs(rpm * gears[currentGear]);
		
		if(motorRPM > maxRPM)  //ograniczenie liczby obrotów na minutę
		{
			motorRPM = maxRPM;
		}		
		
		int index = (int)(motorRPM/efficiencyTableStep);
		index = (int)Mathf.Clamp(index, 0, efficiencyTable.Length - 1);

		//Obliczanie momentu obrotowego
		newTorque = torque * -gears[currentGear] * efficiencyTable[index];
		
		foreach(WheelData wd in Wheels)
		{
			WheelCollider collider = wd.collider;
			
			if(!wd.isFront)
			{
				//wyzerowanie momentu obrotowego jeśli za duża wartość obrotów
				if(Mathf.Abs(collider.rpm) > Mathf.Abs(wantedRPM))
				{
					collider.motorTorque = 0;
				}
				else
				{
					//nadawanie momentu obrotowego zderzaczowi kołowemu
					float curTorque = collider.motorTorque;
					collider.motorTorque = (curTorque * 0.9f + newTorque * 0.1f) * 0.5f;
				}
			}
			collider.brakeTorque = (brake) ? brakeTorque : 0.0f;  //hamowanie
		}
	}
	
	void Update()
	{          
		CheckIfCarIsFlipped();
	}

	float resetTimer = 0.0f;
	protected void CheckIfCarIsFlipped()
	{
		if(transform.localEulerAngles.z > 80 && transform.localEulerAngles.z < 280)
			resetTimer += Time.deltaTime;
		else
			resetTimer = 0;

		if(resetTimer > resetTime)
			FlipCar();
	}

	protected void FlipCar()
	{
		transform.rotation = Quaternion.LookRotation(transform.forward);
		transform.position += Vector3.up * 0.5f;
		rigidbody.velocity = Vector3.zero;
		rigidbody.angularVelocity = Vector3.zero;
		resetTimer = 0;
	}
}