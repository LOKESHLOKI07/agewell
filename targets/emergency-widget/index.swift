import SwiftUI
import WidgetKit

struct AgeWellEmergencyEntry: TimelineEntry {
  let date: Date
}

struct AgeWellEmergencyProvider: TimelineProvider {
  func placeholder(in context: Context) -> AgeWellEmergencyEntry {
    AgeWellEmergencyEntry(date: Date())
  }

  func getSnapshot(in context: Context, completion: @escaping (AgeWellEmergencyEntry) -> Void) {
    completion(AgeWellEmergencyEntry(date: Date()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<AgeWellEmergencyEntry>) -> Void) {
    let timeline = Timeline(entries: [AgeWellEmergencyEntry(date: Date())], policy: .never)
    completion(timeline)
  }
}

struct AgeWellEmergencyView: View {
  private let red = Color(red: 0.898, green: 0.224, blue: 0.208)
  private let muted = Color(red: 0.42, green: 0.42, blue: 0.42)

  var body: some View {
    VStack(spacing: 10) {
      Text("AgeWell")
        .font(.headline)
        .fontWeight(.bold)
        .foregroundColor(Color(red: 0.24, green: 0.545, blue: 0.251))
      ZStack {
        Circle()
          .fill(red)
          .frame(width: 88, height: 88)
        VStack(spacing: 2) {
          Image(systemName: "phone.fill")
            .font(.system(size: 18, weight: .semibold))
            .foregroundColor(.white)
          Text("SOS")
            .font(.system(size: 18, weight: .bold))
            .foregroundColor(.white)
        }
      }
      Text("Tap for Help")
        .font(.subheadline)
        .fontWeight(.semibold)
        .foregroundColor(muted)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .containerBackground(for: .widget) {
      Color.white
    }
  }
}

struct AgeWellEmergencyWidget: Widget {
  let kind: String = "AgeWellEmergency"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: AgeWellEmergencyProvider()) { _ in
      AgeWellEmergencyView()
        .widgetURL(URL(string: "agewell://emergency/widget-sos"))
    }
    .configurationDisplayName("AgeWell Emergency")
    .description("Get AgeWell emergency help from your Home Screen. This does not call 911.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

@main
struct AgeWellEmergencyWidgetBundle: WidgetBundle {
  var body: some Widget {
    AgeWellEmergencyWidget()
  }
}
