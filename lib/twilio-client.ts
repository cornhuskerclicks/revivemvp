export class TwilioClient {
  private accountSid: string
  private authToken: string

  constructor(accountSid: string, authToken: string) {
    this.accountSid = accountSid
    this.authToken = authToken
  }

  private getAuthHeader(): string {
    return `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`
  }

  async sendMessage(to: string, from: string, body: string) {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: this.getAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: from,
        Body: body,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to send message")
    }

    return response.json()
  }

  async verifyCredentials() {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}.json`

    const response = await fetch(url, {
      headers: {
        Authorization: this.getAuthHeader(),
      },
    })

    return response.ok
  }

  async getPhoneNumbers() {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/IncomingPhoneNumbers.json`

    const response = await fetch(url, {
      headers: {
        Authorization: this.getAuthHeader(),
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch phone numbers")
    }

    return response.json()
  }
}
