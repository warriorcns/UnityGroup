using UnityEngine;
using System.Collections;

public class PlayerCarController : Car {

	protected override void CarUpdate() 
	{
		steerScale = Input.GetAxis("Horizontal");
		accel = Input.GetAxis("Vertical");   //przyspieszenie pojazdu
		brake = Input.GetButton ("Jump");       //czy hamuje?

		base.CarUpdate();
	}
}
