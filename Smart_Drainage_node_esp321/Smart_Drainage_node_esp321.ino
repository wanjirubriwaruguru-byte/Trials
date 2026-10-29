

#define TRIG_PIN 5
#define ECHO_PIN 18
#define RAIN_PIN 34
#define FLOW_PIN 27
#define LED_PIN 23
#define BUZZER_PIN 19

// Water level comes from the ultrasonic sensor.
const bool USE_SIMULATED_WATER_LEVEL = false;

// Provisional system thresholds
const float DRAIN_DEPTH_CM = 150.0;
const float WATER_WARNING_CM = 75.0;
const float WATER_CRITICAL_CM = 50.0;

const float RAIN_WARNING_PCT = 30.0;
const float RAIN_CRITICAL_PCT = 70.0;

const float FLOW_NORMAL_LPM = 1.5;
const float FLOW_CRITICAL_LPM = 0.5;
const float BLOCKAGE_FLOW_LPM = 0.6;

// Provisional calibration from Mokxi flow testing
const float PULSES_PER_LITRE = 450.0;

// New fixed sampling interval
const unsigned long SAMPLE_INTERVAL_MS = 15000;

const int RAIN_STABILITY_LIMIT = 500;
const int ZERO_FLOW_WINDOWS_LIMIT = 3;

volatile unsigned long pulseCount = 0;
int zeroFlowWindows = 0;

void IRAM_ATTR countPulse() {
  pulseCount++;
}

// Convert calibrated ADC values into estimated rainfall percentage.
float calculateRainPct(int raw) {
  if (raw >= 4095) return 0.0;
  if (raw <= 1198) return 100.0;

  if (raw >= 2771)
    return (4095.0 - raw) * 25.0 / (4095.0 - 2771.0);

  if (raw >= 2033)
    return 25.0 + (2771.0 - raw) * 25.0 /
           (2771.0 - 2033.0);

  if (raw >= 1535)
    return 50.0 + (2033.0 - raw) * 25.0 /
           (2033.0 - 1535.0);

  return 75.0 + (1535.0 - raw) * 25.0 /
         (1535.0 - 1198.0);
}

// Detect large fluctuations in the analogue rain signal.
// This heuristic cannot detect every possible sensor fault.
bool rainReadingUnstable() {
  int minimum = 4095;
  int maximum = 0;

  for (int i = 0; i < 10; i++) {
    int reading = analogRead(RAIN_PIN);

    if (reading < minimum) minimum = reading;
    if (reading > maximum) maximum = reading;

    delay(5);
  }

  return (maximum - minimum) > RAIN_STABILITY_LIMIT;
}

float readUltrasonicDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000);

  if (duration == 0) return -1.0;

  return duration * 0.0343 / 2.0;
}

void setup() {
  Serial.begin(115200);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(RAIN_PIN, INPUT);
  pinMode(FLOW_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  attachInterrupt(
    digitalPinToInterrupt(FLOW_PIN),
    countPulse,
    FALLING
  );

  digitalWrite(TRIG_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  Serial.println("SMART DRAINAGE MONITOR");
  Serial.println("Water level: ULTRASONIC SENSOR");
  Serial.println("Sampling interval: 10 seconds");
  Serial.println("Thresholds are provisional.");
}

void loop() {
  // Collect flow pulses throughout the fixed sampling window.
  delay(SAMPLE_INTERVAL_MS);

  // Read sensors after the sampling delay.
  float measuredDistance = readUltrasonicDistanceCm();

  int rainRaw = analogRead(RAIN_PIN);
  bool rainUnstable = rainReadingUnstable();
  bool rainValid = !rainUnstable;
  float rainPct = calculateRainPct(rainRaw);

  bool ultrasonicValid =
    measuredDistance >= 0 &&
    measuredDistance <= DRAIN_DEPTH_CM;

  // Select water-level source.
  float waterDistance = -1.0;
  bool waterValid;

  if (USE_SIMULATED_WATER_LEVEL) {
    waterValid = rainValid;

    if (waterValid) {
      waterDistance = DRAIN_DEPTH_CM - rainPct;
    }
  } else {
    waterDistance = measuredDistance;
    waterValid = ultrasonicValid;
  }

  // Snapshot and reset pulse counter safely.
  noInterrupts();
  unsigned long pulses = pulseCount;
  pulseCount = 0;
  interrupts();

  // Estimate flow over the nominal 10-second sampling window.
  // The formula accounts for the actual loop duration.
  const float elapsedMs = (float)SAMPLE_INTERVAL_MS;
  float flowLpm =
    (pulses * 60000.0) /
    (PULSES_PER_LITRE * elapsedMs);

  // Track consecutive near-zero flow windows.
  if (flowLpm < 0.05) {
    zeroFlowWindows++;
  } else {
    zeroFlowWindows = 0;
  }

  // Suspected missing flow signal is not proof of sensor failure.
  bool suspectMissingFlow =
    zeroFlowWindows >= ZERO_FLOW_WINDOWS_LIMIT &&
    waterValid &&
    waterDistance < WATER_WARNING_CM;

  // Water-level classification.
  const char* waterStatus;

  if (!waterValid) {
    waterStatus = "UNAVAILABLE - SENSOR/MODEL FAULT";
  } else if (waterDistance <= WATER_CRITICAL_CM) {
    waterStatus = "CRITICAL";
  } else if (waterDistance < WATER_WARNING_CM) {
    waterStatus = "WARNING";
  } else {
    waterStatus = "NORMAL";
  }

  // Rain classification.
  const char* rainStatus;

  if (!rainValid) {
    rainStatus = "SENSOR FAULT / UNSTABLE";
  } else if (rainPct > RAIN_CRITICAL_PCT) {
    rainStatus = "CRITICAL";
  } else if (rainPct > RAIN_WARNING_PCT) {
    rainStatus = "WARNING";
  } else {
    rainStatus = "NORMAL";
  }

  // Flow classification.
  const char* flowStatus;

  if (suspectMissingFlow) {
    flowStatus = "SUSPECTED NO FLOW / SENSOR FAULT";
  } else if (flowLpm < FLOW_CRITICAL_LPM) {
    flowStatus = "CRITICAL - VERY LOW FLOW";
  } else if (flowLpm < FLOW_NORMAL_LPM) {
    flowStatus = "WARNING";
  } else {
    flowStatus = "NORMAL";
  }

  // Blockage requires elevated water and low measured flow.
  bool possibleBlockage =
    waterValid &&
    waterDistance < WATER_WARNING_CM &&
    flowLpm < BLOCKAGE_FLOW_LPM;

  bool waterWarning =
    waterValid &&
    waterDistance < WATER_WARNING_CM;

  bool waterCritical =
    waterValid &&
    waterDistance <= WATER_CRITICAL_CM;

  // Fault warnings are distinct from confirmed flood alerts.
  bool ledOn = waterWarning || !waterValid;
  bool buzzerOn = waterCritical || !waterValid;

  digitalWrite(LED_PIN, ledOn ? HIGH : LOW);
  digitalWrite(BUZZER_PIN, buzzerOn ? HIGH : LOW);

  // Serial report.
  Serial.println("\n--- DRAIN MONITOR ---");

  Serial.print("Water-level mode: ");
  Serial.println(USE_SIMULATED_WATER_LEVEL
                 ? "SIMULATED FROM RAIN"
                 : "ULTRASONIC SENSOR");

  if (USE_SIMULATED_WATER_LEVEL) {
    Serial.print("Ultrasonic diagnostic: ");
    Serial.println(ultrasonicValid
                   ? "READING AVAILABLE (NOT USED FOR WATER LEVEL)"
                   : "SENSOR FAULT / NOT USED FOR WATER LEVEL");
  }

  Serial.print("Water distance: ");

  if (waterValid) {
    Serial.print(waterDistance, 1);
    Serial.println(" cm");
  } else {
    Serial.println("UNAVAILABLE");
  }

  Serial.print("Water status: ");
  Serial.println(waterStatus);

  Serial.print("Rainfall: ");

  if (rainValid) {
    Serial.print(rainPct, 1);
    Serial.println("%");
  } else {
    Serial.println("UNTRUSTED - DO NOT USE");
  }

  Serial.print("Rain status: ");
  Serial.println(rainStatus);

  Serial.print("Rain sensor quality: ");
  Serial.println(rainValid
                 ? "READING STABLE"
                 : "SUSPECT - UNSTABLE READING");

  Serial.print("Estimated flow: ");
  Serial.print(flowLpm, 2);
  Serial.println(" L/min");

  Serial.print("Flow status: ");
  Serial.println(flowStatus);

  Serial.print("Flow signal quality: ");
  Serial.println(suspectMissingFlow
                 ? "SUSPECT - NO FLOW SIGNAL"
                 : "NO FAULT CONFIRMED");

  Serial.print("LED: ");
  Serial.println(ledOn ? "ON" : "OFF");

  Serial.print("Buzzer: ");
  Serial.println(buzzerOn ? "ON" : "OFF");

  Serial.print("Drain status: ");

  if (!waterValid) {
    Serial.println("WATER LEVEL UNAVAILABLE - CHECK FAULT");
  } else if (possibleBlockage) {
    Serial.println("POSSIBLE BLOCKAGE");
  } else {
    Serial.println("NO BLOCKAGE DETECTED");
  }
}
