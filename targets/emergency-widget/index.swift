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

  var body: some View {
    ZStack {
      Circle()
        .fill(red)
      VStack(spacing: 0) {
        Image(systemName: "phone.fill")
          .font(.system(size: 14, weight: .semibold))
          .foregroundColor(.white)
        Text("SOS")
          .font(.system(size: 12, weight: .bold))
          .foregroundColor(.white)
      }
    }
    .padding(4)
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .containerBackground(for: .widget) {
      Color.clear
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
    .supportedFamilies([.systemSmall])
  }
}

@main
struct AgeWellEmergencyWidgetBundle: WidgetBundle {
  var body: some Widget {
    AgeWellEmergencyWidget()
  }
}
