// Mokxi.
// This circuit has no board, so Run simulates the parts only.
// Add a board and pick a program in its Firmware panel: the editor then shows
// that program's source, and Run builds what you type here for that board.

void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(115200);
}

void loop() {
  digitalWrite(13, HIGH);
  delay(500);
  digitalWrite(13, LOW);
  delay(500);
}
